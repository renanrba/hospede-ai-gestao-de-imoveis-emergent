from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'

# Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PropertyCreate(BaseModel):
    name: str
    type: str  # 'airbnb' or 'residential'
    image_url: Optional[str] = None

class Property(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    type: str
    image_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TransactionCreate(BaseModel):
    property_id: str
    type: str  # 'income' or 'expense'
    category: Optional[str] = None  # For expenses: 'Limpeza', 'Manutenção', 'Água', 'Luz', 'Internet', 'Impostos', 'Condomínio'
    amount: float
    description: Optional[str] = None
    date: str  # YYYY-MM format for monthly grouping

class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    property_id: str
    type: str
    category: Optional[str] = None
    amount: float
    description: Optional[str] = None
    date: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MonthlyReport(BaseModel):
    month: str
    total_income: float
    total_expenses: float
    commission: float  # 15% of income
    net_profit: float
    expenses_by_category: dict

# Auth helpers
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    payload = {
        'user_id': user_id,
        'exp': datetime.now(timezone.utc) + timedelta(days=30)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload['user_id']
    except:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token')

# Auth routes
@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    existing = await db.users.find_one({'email': user_data.email}, {'_id': 0})
    if existing:
        raise HTTPException(status_code=400, detail='Email already registered')
    
    user = User(email=user_data.email, name=user_data.name)
    user_dict = user.model_dump()
    user_dict['password'] = hash_password(user_data.password)
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    
    await db.users.insert_one(user_dict)
    token = create_token(user.id)
    
    return {'token': token, 'user': {'id': user.id, 'email': user.email, 'name': user.name}}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user_dict = await db.users.find_one({'email': credentials.email}, {'_id': 0})
    if not user_dict or not verify_password(credentials.password, user_dict['password']):
        raise HTTPException(status_code=401, detail='Invalid credentials')
    
    token = create_token(user_dict['id'])
    return {'token': token, 'user': {'id': user_dict['id'], 'email': user_dict['email'], 'name': user_dict['name']}}

@api_router.get("/auth/me")
async def get_me(user_id: str = Depends(get_current_user)):
    user_dict = await db.users.find_one({'id': user_id}, {'_id': 0, 'password': 0})
    if not user_dict:
        raise HTTPException(status_code=404, detail='User not found')
    return user_dict

# Property routes
@api_router.post("/properties", response_model=Property)
async def create_property(prop_data: PropertyCreate, user_id: str = Depends(get_current_user)):
    prop = Property(user_id=user_id, **prop_data.model_dump())
    prop_dict = prop.model_dump()
    prop_dict['created_at'] = prop_dict['created_at'].isoformat()
    
    await db.properties.insert_one(prop_dict)
    return prop

@api_router.get("/properties", response_model=List[Property])
async def get_properties(user_id: str = Depends(get_current_user)):
    properties = await db.properties.find({'user_id': user_id}, {'_id': 0}).to_list(100)
    for prop in properties:
        if isinstance(prop['created_at'], str):
            prop['created_at'] = datetime.fromisoformat(prop['created_at'])
    return properties

@api_router.delete("/properties/{property_id}")
async def delete_property(property_id: str, user_id: str = Depends(get_current_user)):
    result = await db.properties.delete_one({'id': property_id, 'user_id': user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail='Property not found')
    await db.transactions.delete_many({'property_id': property_id, 'user_id': user_id})
    return {'message': 'Property deleted'}

# Transaction routes
@api_router.post("/transactions", response_model=Transaction)
async def create_transaction(trans_data: TransactionCreate, user_id: str = Depends(get_current_user)):
    trans = Transaction(user_id=user_id, **trans_data.model_dump())
    trans_dict = trans.model_dump()
    trans_dict['created_at'] = trans_dict['created_at'].isoformat()
    
    await db.transactions.insert_one(trans_dict)
    return trans

@api_router.get("/transactions", response_model=List[Transaction])
async def get_transactions(user_id: str = Depends(get_current_user), month: Optional[str] = None):
    query = {'user_id': user_id}
    if month:
        query['date'] = month
    
    transactions = await db.transactions.find(query, {'_id': 0}).to_list(1000)
    for trans in transactions:
        if isinstance(trans['created_at'], str):
            trans['created_at'] = datetime.fromisoformat(trans['created_at'])
    return transactions

@api_router.delete("/transactions/{transaction_id}")
async def delete_transaction(transaction_id: str, user_id: str = Depends(get_current_user)):
    result = await db.transactions.delete_one({'id': transaction_id, 'user_id': user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail='Transaction not found')
    return {'message': 'Transaction deleted'}

@api_router.put("/transactions/{transaction_id}", response_model=Transaction)
async def update_transaction(transaction_id: str, trans_data: TransactionCreate, user_id: str = Depends(get_current_user)):
    trans = Transaction(id=transaction_id, user_id=user_id, **trans_data.model_dump())
    trans_dict = trans.model_dump()
    trans_dict['created_at'] = trans_dict['created_at'].isoformat()
    
    result = await db.transactions.replace_one({'id': transaction_id, 'user_id': user_id}, trans_dict)
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail='Transaction not found')
    return trans

@api_router.put("/properties/{property_id}", response_model=Property)
async def update_property(property_id: str, prop_data: PropertyCreate, user_id: str = Depends(get_current_user)):
    prop = Property(id=property_id, user_id=user_id, **prop_data.model_dump())
    prop_dict = prop.model_dump()
    prop_dict['created_at'] = prop_dict['created_at'].isoformat()
    
    result = await db.properties.replace_one({'id': property_id, 'user_id': user_id}, prop_dict)
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail='Property not found')
    return prop

# Report routes
@api_router.get("/reports/monthly")
async def get_monthly_report(month: str, user_id: str = Depends(get_current_user)):
    transactions = await db.transactions.find({'user_id': user_id, 'date': month}, {'_id': 0}).to_list(1000)
    
    total_income = sum(t['amount'] for t in transactions if t['type'] == 'income')
    total_expenses = sum(t['amount'] for t in transactions if t['type'] == 'expense')
    commission = total_income * 0.15
    
    expenses_by_category = {}
    for t in transactions:
        if t['type'] == 'expense' and t.get('category'):
            cat = t['category']
            expenses_by_category[cat] = expenses_by_category.get(cat, 0) + t['amount']
    
    return MonthlyReport(
        month=month,
        total_income=total_income,
        total_expenses=total_expenses,
        commission=commission,
        net_profit=total_income - total_expenses - commission,
        expenses_by_category=expenses_by_category
    )

@api_router.get("/reports/income-by-month")
async def get_income_by_month(user_id: str = Depends(get_current_user)):
    transactions = await db.transactions.find({'user_id': user_id, 'type': 'income'}, {'_id': 0}).to_list(10000)
    
    monthly_income = {}
    for t in transactions:
        month = t['date']
        monthly_income[month] = monthly_income.get(month, 0) + t['amount']
    
    return [{'month': k, 'income': v} for k, v in sorted(monthly_income.items())]

@api_router.get("/reports/expenses-by-month")
async def get_expenses_by_month(user_id: str = Depends(get_current_user)):
    transactions = await db.transactions.find({'user_id': user_id, 'type': 'expense'}, {'_id': 0}).to_list(10000)
    
    monthly_expenses = {}
    for t in transactions:
        month = t['date']
        monthly_expenses[month] = monthly_expenses.get(month, 0) + t['amount']
    
    return [{'month': k, 'expenses': v} for k, v in sorted(monthly_expenses.items())]

@api_router.get("/reports/energy-comparison")
async def get_energy_comparison(user_id: str = Depends(get_current_user)):
    transactions = await db.transactions.find(
        {'user_id': user_id, 'type': 'expense', 'category': 'Luz'}, 
        {'_id': 0}
    ).to_list(10000)
    
    monthly_energy = {}
    for t in transactions:
        month = t['date']
        monthly_energy[month] = monthly_energy.get(month, 0) + t['amount']
    
    return [{'month': k, 'energy': v} for k, v in sorted(monthly_energy.items())]

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()