from datetime import datetime, timedelta

from app.services import stripe_service


# =========================================================
# 1. USER REGISTRATION
# =========================================================

def test_user_registration(client):

    response = client.post(
        "/auth/register",
        json={
            "name": "John",
            "email": "john@test.com",
            "password": "John@123",
            "role": "CUSTOMER"
        }
    )

    assert response.status_code == 201

    data = response.json()

    assert data["name"] == "John"
    assert data["email"] == "john@test.com"
    assert data["role"] == "CUSTOMER"


# =========================================================
# 2. LOGIN
# =========================================================

def test_login(client):

    client.post(
        "/auth/register",
        json={
            "name": "Login User",
            "email": "login@test.com",
            "password": "Login@123",
            "role": "CUSTOMER"
        }
    )

    response = client.post(
        "/auth/login",
        json={
            "email": "login@test.com",
            "password": "Login@123"
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert "access_token" in data
    assert data["token_type"] == "bearer"


# =========================================================
# 3. INVALID LOGIN
# =========================================================

def test_invalid_login(client):

    client.post(
        "/auth/register",
        json={
            "name": "Invalid Login",
            "email": "invalid@test.com",
            "password": "Correct@123",
            "role": "CUSTOMER"
        }
    )

    response = client.post(
        "/auth/login",
        json={
            "email": "invalid@test.com",
            "password": "Wrong@123"
        }
    )

    assert response.status_code == 401

    assert response.json()["detail"] == "Invalid email or password"


# =========================================================
# 4. MENU CREATION
# =========================================================

def test_menu_creation(client, admin_headers):

    category_response = client.post(
        "/categories",
        headers=admin_headers,
        json={
            "name": "Biryani"
        }
    )

    assert category_response.status_code == 201

    category_id = category_response.json()["id"]

    response = client.post(
        "/menu",
        headers=admin_headers,
        json={
            "name": "Chicken Biryani",
            "description": "Chicken biryani with rice",
            "category_id": category_id,
            "price": 250,
            "image_url": None,
            "is_available": True
        }
    )

    assert response.status_code == 201

    data = response.json()

    assert data["name"] == "Chicken Biryani"
    assert float(data["price"]) == 250
    assert data["category_id"] == category_id
    assert data["is_available"] is True


# =========================================================
# 5. MENU PAGINATION
# =========================================================

def test_menu_pagination(client, admin_headers, customer_headers):

    category_response = client.post(
        "/categories",
        headers=admin_headers,
        json={
            "name": "Fast Food"
        }
    )

    category_id = category_response.json()["id"]

    for index in range(5):

        response = client.post(
            "/menu",
            headers=admin_headers,
            json={
                "name": f"Food {index}",
                "description": "Test food",
                "category_id": category_id,
                "price": 100 + index,
                "image_url": None,
                "is_available": True
            }
        )

        assert response.status_code == 201

    response = client.get(
        "/menu",
        headers=customer_headers,
        params={
            "page": 1,
            "limit": 2
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert data["page"] == 1
    assert data["limit"] == 2
    assert data["total"] == 5
    assert data["total_pages"] == 3
    assert len(data["items"]) == 2


# =========================================================
# 6. MENU SEARCH
# =========================================================

def test_menu_search(client, admin_headers, customer_headers):

    category_response = client.post(
        "/categories",
        headers=admin_headers,
        json={
            "name": "South Indian"
        }
    )

    category_id = category_response.json()["id"]

    client.post(
        "/menu",
        headers=admin_headers,
        json={
            "name": "Masala Dosa",
            "description": "Crispy dosa",
            "category_id": category_id,
            "price": 80,
            "image_url": None,
            "is_available": True
        }
    )

    client.post(
        "/menu",
        headers=admin_headers,
        json={
            "name": "Chicken Rice",
            "description": "Chicken rice",
            "category_id": category_id,
            "price": 180,
            "image_url": None,
            "is_available": True
        }
    )

    response = client.get(
        "/menu",
        headers=customer_headers,
        params={
            "search": "Dosa"
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert data["total"] == 1
    assert data["items"][0]["name"] == "Masala Dosa"


# =========================================================
# 7. ADD TO CART
# =========================================================

def test_add_to_cart(client, admin_headers, customer_headers):

    category_response = client.post(
        "/categories",
        headers=admin_headers,
        json={
            "name": "Snacks"
        }
    )

    category_id = category_response.json()["id"]

    menu_response = client.post(
        "/menu",
        headers=admin_headers,
        json={
            "name": "Burger",
            "description": "Chicken burger",
            "category_id": category_id,
            "price": 150,
            "image_url": None,
            "is_available": True
        }
    )

    menu_id = menu_response.json()["id"]

    response = client.post(
        "/cart/items",
        headers=customer_headers,
        json={
            "menu_item_id": menu_id,
            "quantity": 2
        }
    )

    assert response.status_code in [200, 201]

    data = response.json()

    assert len(data["items"]) == 1
    assert data["items"][0]["menu_item_id"] == menu_id
    assert data["items"][0]["quantity"] == 2


# =========================================================
# 8. CREATE ORDER
# =========================================================

def test_create_order(client, admin_headers, customer_headers):

    category_response = client.post(
        "/categories",
        headers=admin_headers,
        json={
            "name": "Meals"
        }
    )

    category_id = category_response.json()["id"]

    menu_response = client.post(
        "/menu",
        headers=admin_headers,
        json={
            "name": "Veg Meals",
            "description": "Full meals",
            "category_id": category_id,
            "price": 200,
            "image_url": None,
            "is_available": True
        }
    )

    menu_id = menu_response.json()["id"]

    cart_response = client.post(
        "/cart/items",
        headers=customer_headers,
        json={
            "menu_item_id": menu_id,
            "quantity": 2
        }
    )

    assert cart_response.status_code in [200, 201]

    response = client.post(
        "/orders",
        headers=customer_headers
    )

    assert response.status_code == 201

    data = response.json()

    assert data["status"] == "ORDER_PLACED"
    assert float(data["total_amount"]) == 400


# =========================================================
# 9. DUPLICATE RESERVATION PREVENTION
# =========================================================

def test_duplicate_reservation_prevention(
    client,
    admin_headers,
    customer_headers
):

    table_response = client.post(
        "/tables",
        headers=admin_headers,
        json={
            "table_number": 1,
            "capacity": 4
        }
    )

    assert table_response.status_code == 201

    table_id = table_response.json()["id"]

    reservation_time = (
        datetime.utcnow() + timedelta(days=1)
    ).replace(microsecond=0)

    first_response = client.post(
        "/reservations",
        headers=customer_headers,
        json={
            "table_id": table_id,
            "reservation_date": reservation_time.isoformat(),
            "guests": 2
        }
    )

    assert first_response.status_code == 201

    second_response = client.post(
        "/reservations",
        headers=customer_headers,
        json={
            "table_id": table_id,
            "reservation_date": reservation_time.isoformat(),
            "guests": 2
        }
    )

    assert second_response.status_code == 409

    assert (
        second_response.json()["detail"]
        == "Table is already booked for this time"
    )


# =========================================================
# 10. TABLE AVAILABILITY
# =========================================================

def test_table_availability(
    client,
    admin_headers,
    customer_headers
):

    table_response = client.post(
        "/tables",
        headers=admin_headers,
        json={
            "table_number": 10,
            "capacity": 4
        }
    )

    assert table_response.status_code == 201

    table_id = table_response.json()["id"]

    reservation_time = (
        datetime.utcnow() + timedelta(days=2)
    ).replace(microsecond=0)

    response = client.get(
        "/reservations/available-tables",
        headers=customer_headers,
        params={
            "reservation_date": reservation_time.isoformat(),
            "guests": 2
        }
    )

    assert response.status_code == 200

    tables = response.json()

    assert len(tables) == 1
    assert tables[0]["id"] == table_id


# =========================================================
# 11. STRIPE CHECKOUT CREATION
# =========================================================

def test_stripe_checkout_creation(
    client,
    admin_headers,
    customer_headers,
    monkeypatch
):

    category_response = client.post(
        "/categories",
        headers=admin_headers,
        json={
            "name": "Stripe Food"
        }
    )

    category_id = category_response.json()["id"]

    menu_response = client.post(
        "/menu",
        headers=admin_headers,
        json={
            "name": "Stripe Burger",
            "description": "Test burger",
            "category_id": category_id,
            "price": 300,
            "image_url": None,
            "is_available": True
        }
    )

    menu_id = menu_response.json()["id"]

    client.post(
        "/cart/items",
        headers=customer_headers,
        json={
            "menu_item_id": menu_id,
            "quantity": 1
        }
    )

    order_response = client.post(
        "/orders",
        headers=customer_headers
    )

    assert order_response.status_code == 201

    order_id = order_response.json()["id"]

    # Mock Stripe Checkout
    class MockCheckoutSession:
        url = "https://checkout.stripe.test/session"

    def mock_create_checkout_session(
        resource_type,
        resource_id,
        amount,
        customer_email,
        success_url,
        cancel_url
    ):
        return MockCheckoutSession()

    monkeypatch.setattr(
        stripe_service,
        "create_checkout_session",
        mock_create_checkout_session
    )

    response = client.post(
        "/payments/create-checkout-session",
        headers=customer_headers,
        params={
            "order_id": order_id
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert "checkout_url" in data
    assert data["checkout_url"] == "https://checkout.stripe.test/session"


# =========================================================
# 12. UNAUTHORIZED API ACCESS
# =========================================================

def test_unauthorized_api_access(client):

    response = client.get("/auth/me")

    assert response.status_code in [401, 403]


# =========================================================
# 13. ADMIN AUTHORIZATION
# =========================================================

def test_customer_cannot_create_menu(
    client,
    customer_headers
):

    response = client.post(
        "/menu",
        headers=customer_headers,
        json={
            "name": "Unauthorized Food",
            "description": "Test",
            "category_id": 1,
            "price": 100,
            "image_url": None,
            "is_available": True
        }
    )

    assert response.status_code == 403


# =========================================================
# 14. ORDER OWNERSHIP
# =========================================================

def test_customer_can_only_access_own_orders(
    client,
    admin_headers,
    customer_headers
):

    category_response = client.post(
        "/categories",
        headers=admin_headers,
        json={
            "name": "Ownership Test"
        }
    )

    category_id = category_response.json()["id"]

    menu_response = client.post(
        "/menu",
        headers=admin_headers,
        json={
            "name": "Ownership Food",
            "description": "Test food",
            "category_id": category_id,
            "price": 100,
            "image_url": None,
            "is_available": True
        }
    )

    menu_id = menu_response.json()["id"]

    client.post(
        "/cart/items",
        headers=customer_headers,
        json={
            "menu_item_id": menu_id,
            "quantity": 1
        }
    )

    order_response = client.post(
        "/orders",
        headers=customer_headers
    )

    assert order_response.status_code == 201

    order_id = order_response.json()["id"]

    # Register second customer
    client.post(
        "/auth/register",
        json={
            "name": "Second Customer",
            "email": "second@test.com",
            "password": "Second@123",
            "role": "CUSTOMER"
        }
    )

    login_response = client.post(
        "/auth/login",
        json={
            "email": "second@test.com",
            "password": "Second@123"
        }
    )

    second_token = login_response.json()["access_token"]

    second_headers = {
        "Authorization": f"Bearer {second_token}"
    }

    response = client.get(
        f"/orders/{order_id}",
        headers=second_headers
    )

    assert response.status_code == 403