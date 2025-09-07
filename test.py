import requests
import os
from dotenv import load_dotenv

def test_huggingface_comprehensive():
    # Load environment
    load_dotenv()
    
    # Get token
    api_token = os.getenv('HUGGINGFACE_API_TOKEN')
    
    print("=== TOKEN VERIFICATION ===")
    print(f"Token loaded: {'Yes' if api_token else 'No'}")
    
    if not api_token:
        print("❌ No token found in environment variables")
        print("Check your .env file exists and contains HUGGINGFACE_API_TOKEN")
        return
    
    print(f"Token preview: {api_token[:10]}...{api_token[-5:]}")
    print(f"Token length: {len(api_token)}")
    print(f"Starts with 'hf_': {api_token.startswith('hf_')}")
    
    if len(api_token) != 37 or not api_token.startswith('hf_'):
        print("❌ Token format looks incorrect")
        print("Expected: 37 characters starting with 'hf_'")
        return
    
    print("\n=== API TEST ===")
    
    # Test with a simple, always-available model
    headers = {"Authorization": f"Bearer {api_token}"}
    api_url = "https://api-inference.huggingface.co/models/gpt2"
    
    payload = {
        "inputs": "Hello",
        "parameters": {"max_length": 10}
    }
    
    try:
        print("Making API request...")
        response = requests.post(api_url, headers=headers, json=payload, timeout=15)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print("✅ SUCCESS: Token is working perfectly!")
            result = response.json()
            print(f"API Response: {result}")
            
        elif response.status_code == 401:
            print("❌ AUTHORIZATION ERROR")
            print("Response:", response.text)
            print("\nPossible solutions:")
            print("1. Re-create the token with correct permissions")
            print("2. Make sure token is copied exactly without extra characters")
            print("3. Verify token hasn't expired")
            
        elif response.status_code == 503:
            print("⏳ Model loading (Token is valid but model unavailable)")
            print("This actually means your token works!")
            
        else:
            print(f"❌ Unexpected error: {response.status_code}")
            print("Response:", response.text)
            
    except Exception as e:
        print(f"❌ Connection error: {e}")

if __name__ == "__main__":
    test_huggingface_comprehensive()
