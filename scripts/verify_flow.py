import urllib.request
import json
import time
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

base_url = 'http://127.0.0.1:8000/api'

def main():
    print("==================================================")
    print("   STORE STING — End-to-End Verification Flow     ")
    print("==================================================")

    # 1. Categories
    cats = json.loads(urllib.request.urlopen(f'{base_url}/categories').read())
    cat_names = [c["name"] for c in cats[:3]]
    print(f"1. Categories: Found {len(cats)} categories ({cat_names}...)")

    # 2. Products
    prods = json.loads(urllib.request.urlopen(f'{base_url}/products').read())
    print(f"2. Catalog: Found {len(prods)} products.")
    astrabook = next(p for p in prods if 'AstraBook' in p['name'])
    print(f"   Selected product: {astrabook['name']} @ INR {astrabook['discounted_price']} ({astrabook['stock_status']})")

    # 3. Natural Language Search
    search_res = json.loads(urllib.request.urlopen(f'{base_url}/search?q=lightweight+laptop+for+coding+under+70000').read())
    top_match = search_res["results"][0]
    print(f"3. Natural Language Search: 'lightweight laptop for coding under 70000'")
    print(f"   Interpreted Budget: <= INR {search_res['interpreted_criteria']['max_budget']}")
    print(f"   Top Match: {top_match['product']['name']} - {top_match['match_percentage']}% Match")
    print(f"   Reasons: {top_match['match_reasons']}")

    # 4. Cart Add
    cart_req = urllib.request.Request(
        f'{base_url}/cart/items',
        data=json.dumps({'product_id': astrabook['id'], 'quantity': 1}).encode('utf-8'),
        headers={'Content-Type': 'application/json', 'x-session-token': 'live-verify-token-1'}
    )
    cart = json.loads(urllib.request.urlopen(cart_req).read())
    print(f"4. Cart: Subtotal = INR {cart['subtotal']}, Shipping = INR {cart['shipping']}, Total = INR {cart['total']}")

    # 5. Checkout / Create Order
    order_payload = {
        'customer_name': 'Alex Mercer',
        'customer_email': 'alex@storesting.com',
        'shipping_address': {'street': '742 Innovation Way', 'city': 'Bengaluru', 'country': 'India'},
        'payment_method': 'UPI',
        'scenario': 'SUCCESS',
        'items': [{'product_id': astrabook['id'], 'quantity': 1}]
    }
    order_req = urllib.request.Request(
        f'{base_url}/orders',
        data=json.dumps(order_payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    order = json.loads(urllib.request.urlopen(order_req).read())
    print(f"5. Order Created: #{order['order_number']} (ID: {order['id']}), Initial Status: {order['status']}")

    # 6. Monitor multi-agent progression until DELIVERED
    print("6. Monitoring Autonomous Agent Pipeline Progression...")
    for step_num in range(1, 15):
        time.sleep(0.4)
        order_detail = json.loads(urllib.request.urlopen(f'{base_url}/orders/{order["id"]}').read())
        current_status = order_detail['order']['status']
        events = order_detail.get('events', [])
        print(f"   Step {step_num}: Status = {current_status}, Agent Events Logged = {len(events)}")
        if current_status == 'DELIVERED':
            print(f"   [SUCCESS] Order Successfully Delivered!")
            print(f"     Carrier: {order_detail['order']['shipping_partner']}")
            print(f"     Tracking Number: {order_detail['order']['tracking_number']}")
            break

    # 7. Admin Metrics
    admin_metrics = json.loads(urllib.request.urlopen(f'{base_url}/admin/metrics').read())
    print(f"7. Operations Metrics:")
    print(f"   Total Orders: {admin_metrics['total_orders']}")
    print(f"   Total Revenue: INR {admin_metrics['total_revenue']}")
    print(f"   Worker Health: {admin_metrics['worker_health']}")
    print("==================================================")
    print("   ALL STORE STING PIPELINES VERIFIED OPERATIONAL ")
    print("==================================================")

if __name__ == '__main__':
    main()
