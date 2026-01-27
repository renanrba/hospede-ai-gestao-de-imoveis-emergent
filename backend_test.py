import requests
import sys
import json
from datetime import datetime

class AirbnbPropertyManagerTester:
    def __init__(self, base_url="https://rental-tracker-66.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.property_id = None
        self.transaction_id = None
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_user_registration(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_user_data = {
            "email": f"test_user_{timestamp}@example.com",
            "password": "TestPass123!",
            "name": f"Test User {timestamp}"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_user_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            print(f"   User ID: {self.user_id}")
            return True
        return False

    def test_user_login(self):
        """Test user login with existing credentials"""
        # Use the same credentials from registration
        timestamp = datetime.now().strftime('%H%M%S')
        login_data = {
            "email": f"test_user_{timestamp}@example.com",
            "password": "TestPass123!"
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            return True
        return False

    def test_get_user_profile(self):
        """Test getting user profile"""
        success, response = self.run_test(
            "Get User Profile",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_create_property(self):
        """Test creating a property"""
        property_data = {
            "name": "Test Flat 101 - Centro",
            "type": "airbnb",
            "image_url": "https://images.unsplash.com/photo-1761864294727-3c9f6b3e7425?crop=entropy&cs=srgb&fm=jpg&q=85"
        }
        
        success, response = self.run_test(
            "Create Property",
            "POST",
            "properties",
            200,
            data=property_data
        )
        
        if success and 'id' in response:
            self.property_id = response['id']
            print(f"   Property ID: {self.property_id}")
            return True
        return False

    def test_get_properties(self):
        """Test getting user properties"""
        success, response = self.run_test(
            "Get Properties",
            "GET",
            "properties",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   Found {len(response)} properties")
            return True
        return False

    def test_create_income_transaction(self):
        """Test creating an income transaction"""
        if not self.property_id:
            print("❌ No property ID available for transaction test")
            return False
            
        transaction_data = {
            "property_id": self.property_id,
            "type": "income",
            "amount": 2500.00,
            "description": "Pagamento Airbnb Janeiro",
            "date": "2025-01"
        }
        
        success, response = self.run_test(
            "Create Income Transaction",
            "POST",
            "transactions",
            200,
            data=transaction_data
        )
        
        if success and 'id' in response:
            self.transaction_id = response['id']
            print(f"   Transaction ID: {self.transaction_id}")
            return True
        return False

    def test_create_expense_transaction(self):
        """Test creating an expense transaction"""
        if not self.property_id:
            print("❌ No property ID available for expense test")
            return False
            
        expense_data = {
            "property_id": self.property_id,
            "type": "expense",
            "category": "Limpeza",
            "amount": 150.00,
            "description": "Limpeza mensal",
            "date": "2025-01"
        }
        
        success, response = self.run_test(
            "Create Expense Transaction",
            "POST",
            "transactions",
            200,
            data=expense_data
        )
        return success

    def test_get_transactions(self):
        """Test getting transactions"""
        success, response = self.run_test(
            "Get Transactions",
            "GET",
            "transactions",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   Found {len(response)} transactions")
            return True
        return False

    def test_monthly_report(self):
        """Test monthly report generation"""
        success, response = self.run_test(
            "Get Monthly Report",
            "GET",
            "reports/monthly?month=2025-01",
            200
        )
        
        if success:
            print(f"   Total Income: {response.get('total_income', 0)}")
            print(f"   Total Expenses: {response.get('total_expenses', 0)}")
            print(f"   Commission (15%): {response.get('commission', 0)}")
            print(f"   Net Profit: {response.get('net_profit', 0)}")
            return True
        return False

    def test_income_by_month_report(self):
        """Test income by month report"""
        success, response = self.run_test(
            "Get Income by Month",
            "GET",
            "reports/income-by-month",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   Found income data for {len(response)} months")
            return True
        return False

    def test_expenses_by_month_report(self):
        """Test expenses by month report"""
        success, response = self.run_test(
            "Get Expenses by Month",
            "GET",
            "reports/expenses-by-month",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   Found expense data for {len(response)} months")
            return True
        return False

    def test_energy_comparison_report(self):
        """Test energy comparison report"""
        # First create an energy expense
        if self.property_id:
            energy_data = {
                "property_id": self.property_id,
                "type": "expense",
                "category": "Luz",
                "amount": 180.00,
                "description": "Conta de luz janeiro",
                "date": "2025-01"
            }
            
            self.run_test(
                "Create Energy Expense",
                "POST",
                "transactions",
                200,
                data=energy_data
            )
        
        success, response = self.run_test(
            "Get Energy Comparison",
            "GET",
            "reports/energy-comparison",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   Found energy data for {len(response)} months")
            return True
        return False

    def test_delete_transaction(self):
        """Test deleting a transaction"""
        if not self.transaction_id:
            print("❌ No transaction ID available for delete test")
            return False
            
        success, response = self.run_test(
            "Delete Transaction",
            "DELETE",
            f"transactions/{self.transaction_id}",
            200
        )
        return success

    def test_delete_property(self):
        """Test deleting a property"""
        if not self.property_id:
            print("❌ No property ID available for delete test")
            return False
            
        success, response = self.run_test(
            "Delete Property",
            "DELETE",
            f"properties/{self.property_id}",
            200
        )
        return success

def main():
    print("🏠 Starting Airbnb Property Manager API Tests")
    print("=" * 60)
    
    tester = AirbnbPropertyManagerTester()
    
    # Test sequence
    test_sequence = [
        ("User Registration", tester.test_user_registration),
        ("User Profile", tester.test_get_user_profile),
        ("Create Property", tester.test_create_property),
        ("Get Properties", tester.test_get_properties),
        ("Create Income Transaction", tester.test_create_income_transaction),
        ("Create Expense Transaction", tester.test_create_expense_transaction),
        ("Get Transactions", tester.test_get_transactions),
        ("Monthly Report", tester.test_monthly_report),
        ("Income by Month Report", tester.test_income_by_month_report),
        ("Expenses by Month Report", tester.test_expenses_by_month_report),
        ("Energy Comparison Report", tester.test_energy_comparison_report),
        ("Delete Transaction", tester.test_delete_transaction),
        ("Delete Property", tester.test_delete_property),
    ]
    
    # Run all tests
    for test_name, test_func in test_sequence:
        try:
            test_func()
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())