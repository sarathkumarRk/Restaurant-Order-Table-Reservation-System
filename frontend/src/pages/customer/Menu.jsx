import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../../api/axios";

function Menu() {
  const [menu, setMenu] = useState({
    items: [],
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 0,
  });

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [loading, setLoading] = useState(false);
  const [addingItem, setAddingItem] = useState(null);

  const fetchMenu = async (
    page = 1,
    searchValue = search,
    categoryValue = category,
    minPriceValue = minPrice,
    maxPriceValue = maxPrice
  ) => {
    try {
      setLoading(true);

      const params = {
        page,
        limit: 10,
      };

      if (searchValue.trim()) {
        params.search = searchValue.trim();
      }

      if (categoryValue) {
        params.category = categoryValue;
      }

      if (minPriceValue !== "") {
        params.min_price = minPriceValue;
      }

      if (maxPriceValue !== "") {
        params.max_price = maxPriceValue;
      }

      const response = await API.get("/menu", {
        params,
      });

      setMenu(response.data);
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Failed to load menu"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu(1);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();

    if (
      minPrice !== "" &&
      maxPrice !== "" &&
      Number(minPrice) > Number(maxPrice)
    ) {
      toast.error("Min price cannot be greater than max price");
      return;
    }

    fetchMenu(1, search, category, minPrice, maxPrice);
  };

  const handleCategoryChange = (e) => {
    const value = e.target.value;

    setCategory(value);

    if (
      minPrice !== "" &&
      maxPrice !== "" &&
      Number(minPrice) > Number(maxPrice)
    ) {
      toast.error("Min price cannot be greater than max price");
      return;
    }

    fetchMenu(1, search, value, minPrice, maxPrice);
  };

  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setMinPrice("");
    setMaxPrice("");

    fetchMenu(1, "", "", "", "");
  };

  const addToCart = async (menuItemId) => {
    try {
      setAddingItem(menuItemId);

      await API.post("/cart/items", {
        menu_item_id: menuItemId,
        quantity: 1,
      });

      toast.success("Added to cart");
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Failed to add item to cart"
      );
    } finally {
      setAddingItem(null);
    }
  };

  const goToPage = (page) => {
    if (
      page < 1 ||
      page > menu.total_pages ||
      page === menu.page
    ) {
      return;
    }

    fetchMenu(
      page,
      search,
      category,
      minPrice,
      maxPrice
    );
  };

  return (
    <div className="min-h-screen bg-white px-4 py-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-red-600">
              Our Menu
            </h1>

            <p className="text-gray-600 mt-1">
              Choose your favourite food
            </p>
          </div>

          <Link
            to="/cart"
            className="bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-lg font-semibold text-center"
          >
            View Cart
          </Link>
        </div>

        {/* Filters */}
        <form
          onSubmit={handleSearch}
          className="border border-red-200 rounded-xl p-5 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">

            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-red-600 mb-2">
                Search Food
              </label>

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search Biryani..."
                className="w-full px-4 py-3 border border-red-300 rounded-lg outline-none focus:border-red-600"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-red-600 mb-2">
                Category
              </label>

              <select
                value={category}
                onChange={handleCategoryChange}
                className="w-full px-4 py-3 border border-red-300 rounded-lg outline-none focus:border-red-600"
              >
                <option value="">All</option>
                <option value="veg">Veg</option>
                <option value="non-veg">Non-Veg</option>
                <option value="desserts">Desserts</option>
              </select>
            </div>

            {/* Min Price */}
            <div>
              <label className="block text-sm font-medium text-red-600 mb-2">
                Min Price
              </label>

              <input
                type="number"
                min="0"
                value={minPrice}
                onChange={(e) =>
                  setMinPrice(e.target.value)
                }
                placeholder="₹100"
                className="w-full px-4 py-3 border border-red-300 rounded-lg outline-none focus:border-red-600"
              />
            </div>

            {/* Max Price */}
            <div>
              <label className="block text-sm font-medium text-red-600 mb-2">
                Max Price
              </label>

              <input
                type="number"
                min="0"
                value={maxPrice}
                onChange={(e) =>
                  setMaxPrice(e.target.value)
                }
                placeholder="₹1000"
                className="w-full px-4 py-3 border border-red-300 rounded-lg outline-none focus:border-red-600"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap gap-3 mt-5">
            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Search
            </button>

            <button
              type="button"
              onClick={clearFilters}
              className="border border-red-600 text-red-600 hover:bg-red-50 px-6 py-3 rounded-lg font-semibold"
            >
              Clear Filters
            </button>
          </div>
        </form>

        {/* Loading */}
        {loading ? (
          <div className="text-center py-16">
            <p className="text-red-600 font-semibold">
              Loading menu...
            </p>
          </div>
        ) : menu.items.length === 0 ? (

          /* Empty */
          <div className="border border-red-200 rounded-xl p-10 text-center">
            <h2 className="text-xl font-semibold text-red-600">
              No food items found
            </h2>

            <p className="text-gray-600 mt-2">
              Try changing your search or filters.
            </p>
          </div>

        ) : (
          <>
            {/* Menu Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

              {menu.items.map((item) => (
                <div
                  key={item.id}
                  className="border border-red-200 rounded-xl overflow-hidden bg-white"
                >
                  {/* Image */}
                  <div className="h-48 bg-red-50 flex items-center justify-center overflow-hidden">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-red-600 font-semibold">
                        No Image
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5">

                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-lg font-bold">
                        {item.name}
                      </h2>

                      <span className="text-red-600 font-bold whitespace-nowrap">
                        ₹{Number(item.price).toFixed(2)}
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                      {item.description ||
                        "No description available"}
                    </p>

                    {/* Availability */}
                    <div className="mt-4">
                      {item.is_available ? (
                        <span className="text-red-600 text-sm font-semibold">
                          Available
                        </span>
                      ) : (
                        <span className="text-red-400 text-sm font-semibold">
                          Unavailable
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-5">

                      <Link
                        to={`/menu/${item.id}`}
                        className="flex-1 text-center border border-red-600 text-red-600 hover:bg-red-50 py-2.5 rounded-lg font-semibold"
                      >
                        View
                      </Link>

                      <button
                        type="button"
                        disabled={
                          !item.is_available ||
                          addingItem === item.id
                        }
                        onClick={() =>
                          addToCart(item.id)
                        }
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {addingItem === item.id
                          ? "Adding..."
                          : "Add to Cart"}
                      </button>

                    </div>
                  </div>
                </div>
              ))}

            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2 mt-10">

              <button
                type="button"
                onClick={() =>
                  goToPage(menu.page - 1)
                }
                disabled={menu.page === 1}
                className="px-4 py-2 border border-red-600 text-red-600 rounded-lg disabled:opacity-40"
              >
                Previous
              </button>

              {Array.from(
                { length: menu.total_pages },
                (_, index) => index + 1
              ).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => goToPage(page)}
                  className={`px-4 py-2 rounded-lg font-semibold ${
                    page === menu.page
                      ? "bg-red-600 text-white"
                      : "border border-red-600 text-red-600 hover:bg-red-50"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                onClick={() =>
                  goToPage(menu.page + 1)
                }
                disabled={
                  menu.page === menu.total_pages
                }
                className="px-4 py-2 border border-red-600 text-red-600 rounded-lg disabled:opacity-40"
              >
                Next
              </button>

            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Menu;