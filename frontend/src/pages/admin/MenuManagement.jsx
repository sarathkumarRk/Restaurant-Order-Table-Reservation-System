import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import API from "../../api/axios";

function MenuManagement() {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [editingId, setEditingId] = useState(null);

  const [imageFile, setImageFile] = useState(null);

  // Category form
  const [categoryName, setCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    category_id: "",
    price: "",
    is_available: true,
  });

  const fileInputRefs = useRef({});

  // =========================
  // Fetch Menu
  // =========================

  const fetchMenu = async () => {
    try {
      setLoading(true);

      const response = await API.get("/menu", {
        params: {
          page: 1,
          limit: 100,
        },
      });

      setMenuItems(response.data.items || []);
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Failed to load menu"
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // Fetch Categories
  // =========================

  const fetchCategories = async () => {
    try {
      const response = await API.get("/categories");

      setCategories(response.data || []);
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Failed to load categories"
      );
    }
  };

  // =========================
  // Initial Load
  // =========================

  useEffect(() => {
    fetchMenu();
    fetchCategories();
  }, []);

  // =========================
  // Form Change
  // =========================

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // =========================
  // Category Create
  // =========================

  const createCategory = async (e) => {
    e.preventDefault();

    const trimmedName = categoryName.trim();

    if (!trimmedName) {
      toast.error("Category name is required");
      return;
    }

    try {
      setCreatingCategory(true);

      const response = await API.post("/categories", {
        name: trimmedName,
      });

      setCategories((currentCategories) => [
        ...currentCategories,
        response.data,
      ]);

      setCategoryName("");

      toast.success("Category created successfully");
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Failed to create category"
      );
    } finally {
      setCreatingCategory(false);
    }
  };

  // =========================
  // Image Change
  // =========================

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      setImageFile(null);
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error(
        "Only JPG, JPEG, PNG and WEBP images are allowed"
      );

      e.target.value = "";
      setImageFile(null);
      return;
    }

    setImageFile(file);
  };

  // =========================
  // Reset Food Form
  // =========================

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      category_id: "",
      price: "",
      is_available: true,
    });

    setImageFile(null);
    setEditingId(null);
  };

  // =========================
  // Upload Image
  // =========================

  const uploadImage = async (menuId, file) => {
    if (!file) {
      return null;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error(
        "Only JPG, JPEG, PNG and WEBP images are allowed"
      );

      return null;
    }

    try {
      setUploadingId(menuId);

      const formData = new FormData();

      formData.append("image", file);

      const response = await API.post(
        `/menu/${menuId}/image`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setMenuItems((currentItems) =>
        currentItems.map((item) =>
          item.id === menuId
            ? response.data
            : item
        )
      );

      return response.data;
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Failed to upload image"
      );

      return null;
    } finally {
      setUploadingId(null);
    }
  };

  // =========================
  // Create / Update Food
  // =========================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Food name is required");
      return;
    }

    if (!form.category_id) {
      toast.error("Please select a category");
      return;
    }

    if (!form.price || Number(form.price) < 0) {
      toast.error("Enter a valid price");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        category_id: Number(form.category_id),
        price: Number(form.price),
        image_url: null,
        is_available: form.is_available,
      };

      // =========================
      // Update Food
      // =========================

      if (editingId) {
        const response = await API.put(
          `/menu/${editingId}`,
          payload
        );

        let updatedItem = response.data;

        if (imageFile) {
          const uploadedItem = await uploadImage(
            editingId,
            imageFile
          );

          if (uploadedItem) {
            updatedItem = uploadedItem;
          }
        }

        setMenuItems((currentItems) =>
          currentItems.map((item) =>
            item.id === editingId
              ? updatedItem
              : item
          )
        );

        toast.success(
          "Food item updated successfully"
        );
      }

      // =========================
      // Create Food
      // =========================

      else {
        const response = await API.post(
          "/menu",
          payload
        );

        const menuId = response.data.id;

        let createdItem = response.data;

        if (imageFile) {
          const uploadedItem = await uploadImage(
            menuId,
            imageFile
          );

          if (uploadedItem) {
            createdItem = uploadedItem;
          }
        }

        setMenuItems((currentItems) => [
          createdItem,
          ...currentItems,
        ]);

        toast.success(
          "Food item created successfully"
        );
      }

      resetForm();
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Failed to save food item"
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // Edit Food
  // =========================

  const startEdit = (item) => {
    setEditingId(item.id);

    setForm({
      name: item.name || "",
      description: item.description || "",
      category_id: item.category_id
        ? String(item.category_id)
        : "",
      price: item.price ?? "",
      is_available: item.is_available,
    });

    setImageFile(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================
  // Delete Food
  // =========================

  const deleteMenuItem = async (menuId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this food item?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(menuId);

      await API.delete(`/menu/${menuId}`);

      setMenuItems((currentItems) =>
        currentItems.filter(
          (item) => item.id !== menuId
        )
      );

      if (editingId === menuId) {
        resetForm();
      }

      toast.success(
        "Food item deleted successfully"
      );
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Failed to delete food item"
      );
    } finally {
      setDeletingId(null);
    }
  };

  // =========================
  // Existing Item Image Upload
  // =========================

  const openFilePicker = (menuId) => {
    fileInputRefs.current[menuId]?.click();
  };

  const handleExistingItemImageUpload = async (
    menuId,
    file
  ) => {
    if (!file) {
      return;
    }

    await uploadImage(menuId, file);
  };

  // =========================
  // UI
  // =========================

  return (
    <div className="min-h-screen bg-white px-4 py-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-red-600">
            Menu Management
          </h1>

          <p className="text-gray-600 mt-1">
            Create, update, delete and manage food items
          </p>
        </div>

        {/* =========================
            CATEGORY MANAGEMENT
        ========================= */}

        <div className="border border-red-200 rounded-xl p-6 mb-8">

          <h2 className="text-xl font-bold text-red-600">
            Category Management
          </h2>

          <p className="text-gray-600 text-sm mt-1 mb-5">
            Create food categories
          </p>

          <form
            onSubmit={createCategory}
            className="flex flex-col md:flex-row gap-4"
          >
            <input
              type="text"
              value={categoryName}
              onChange={(e) =>
                setCategoryName(e.target.value)
              }
              placeholder="Enter category name"
              className="flex-1 px-4 py-3 border border-red-300 rounded-lg outline-none focus:border-red-600"
            />

            <button
              type="submit"
              disabled={creatingCategory}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creatingCategory
                ? "Creating..."
                : "Create Category"}
            </button>
          </form>

          {/* Existing Categories */}

          {categories.length > 0 && (
            <div className="mt-5">

              <p className="text-sm font-semibold text-gray-700 mb-3">
                Existing Categories
              </p>

              <div className="flex flex-wrap gap-2">

                {categories.map((category) => (
                  <span
                    key={category.id}
                    className="border border-red-300 text-red-600 px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    {category.name}
                  </span>
                ))}

              </div>
            </div>
          )}

          {categories.length === 0 && (
            <p className="text-sm text-red-500 mt-4">
              No categories available. Create a category first.
            </p>
          )}

        </div>

        {/* =========================
            ADD / EDIT FOOD
        ========================= */}

        <div className="border border-red-200 rounded-xl p-6 mb-8">

          <div className="flex items-center justify-between mb-6">

            <h2 className="text-xl font-bold text-red-600">
              {editingId
                ? "Edit Food Item"
                : "Add Food Item"}
            </h2>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="border border-red-600 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg font-semibold"
              >
                Cancel Edit
              </button>
            )}

          </div>

          <form onSubmit={handleSubmit}>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* Food Name */}

              <div>
                <label className="block text-sm font-medium text-red-600 mb-2">
                  Food Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Chicken Biryani"
                  className="w-full px-4 py-3 border border-red-300 rounded-lg outline-none focus:border-red-600"
                />
              </div>

              {/* Category */}

              <div>
                <label className="block text-sm font-medium text-red-600 mb-2">
                  Category
                </label>

                <select
                  name="category_id"
                  value={form.category_id}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-red-300 rounded-lg outline-none focus:border-red-600 bg-white"
                >
                  <option value="">
                    Select Category
                  </option>

                  {categories.map((category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price */}

              <div>
                <label className="block text-sm font-medium text-red-600 mb-2">
                  Price
                </label>

                <input
                  type="number"
                  name="price"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="250"
                  className="w-full px-4 py-3 border border-red-300 rounded-lg outline-none focus:border-red-600"
                />
              </div>

              {/* Image */}

              <div>
                <label className="block text-sm font-medium text-red-600 mb-2">
                  Food Image
                </label>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  onChange={handleImageChange}
                  className="w-full px-4 py-3 border border-red-300 rounded-lg outline-none focus:border-red-600"
                />

                <p className="text-xs text-gray-500 mt-1">
                  JPG, JPEG, PNG or WEBP only.
                </p>

                {imageFile && (
                  <p className="text-sm text-red-600 mt-2 font-medium">
                    Selected: {imageFile.name}
                  </p>
                )}
              </div>

              {/* Description */}

              <div className="md:col-span-2">

                <label className="block text-sm font-medium text-red-600 mb-2">
                  Description
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Food description..."
                  className="w-full px-4 py-3 border border-red-300 rounded-lg outline-none focus:border-red-600 resize-none"
                />

              </div>

              {/* Availability */}

              <div className="md:col-span-2">

                <label className="flex items-center gap-3 cursor-pointer">

                  <input
                    type="checkbox"
                    name="is_available"
                    checked={form.is_available}
                    onChange={handleChange}
                    className="w-5 h-5 accent-red-600"
                  />

                  <span className="font-semibold text-gray-700">
                    Food is available
                  </span>

                </label>

              </div>

            </div>

            {/* Submit */}

            <div className="mt-6">

              <button
                type="submit"
                disabled={
                  saving ||
                  categories.length === 0
                }
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Update Food"
                  : "Add Food"}
              </button>

            </div>

          </form>
        </div>

        {/* =========================
            FOOD ITEMS
        ========================= */}

        <div className="border border-red-200 rounded-xl p-6">

          <div className="flex items-center justify-between mb-6">

            <h2 className="text-xl font-bold text-red-600">
              Food Items
            </h2>

            <span className="text-sm text-gray-500">
              {menuItems.length} item(s)
            </span>

          </div>

          {loading ? (

            <div className="text-center py-12">
              <p className="text-red-600 font-semibold">
                Loading menu...
              </p>
            </div>

          ) : menuItems.length === 0 ? (

            <div className="text-center py-12">
              <p className="text-gray-600">
                No food items found.
              </p>
            </div>

          ) : (

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

              {menuItems.map((item) => (

                <div
                  key={item.id}
                  className="border border-red-200 rounded-xl overflow-hidden"
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

                  <div className="p-5">

                    {/* Name / Price */}

                    <div className="flex items-start justify-between gap-3">

                      <h3 className="text-lg font-bold text-gray-900">
                        {item.name}
                      </h3>

                      <span className="text-red-600 font-bold whitespace-nowrap">
                        ₹{Number(item.price).toFixed(2)}
                      </span>

                    </div>

                    {/* Description */}

                    <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                      {item.description ||
                        "No description available"}
                    </p>

                    {/* Category */}

                    <p className="text-sm text-gray-500 mt-3">
                      Category:{" "}
                      {categories.find(
                        (category) =>
                          category.id === item.category_id
                      )?.name ||
                        `ID ${item.category_id}`}
                    </p>

                    {/* Availability */}

                    <div className="mt-3">

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

                    {/* Edit / Delete */}

                    <div className="flex gap-2 mt-5">

                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="flex-1 border border-red-600 text-red-600 hover:bg-red-50 py-2.5 rounded-lg font-semibold"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          deleteMenuItem(item.id)
                        }
                        disabled={
                          deletingId === item.id
                        }
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingId === item.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>

                    </div>

                    {/* Hidden File Input */}

                    <input
                      ref={(element) => {
                        fileInputRefs.current[item.id] =
                          element;
                      }}
                      type="file"
                      accept="image/jpeg,image/png,image/jpg,image/webp"
                      className="hidden"
                      onChange={(e) =>
                        handleExistingItemImageUpload(
                          item.id,
                          e.target.files?.[0]
                        )
                      }
                    />

                    {/* Upload Image */}

                    <button
                      type="button"
                      onClick={() =>
                        openFilePicker(item.id)
                      }
                      disabled={
                        uploadingId === item.id
                      }
                      className="w-full mt-2 border border-red-600 text-red-600 hover:bg-red-50 py-2.5 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploadingId === item.id
                        ? "Uploading..."
                        : "Upload Image"}
                    </button>

                  </div>
                </div>

              ))}

            </div>

          )}

        </div>

      </div>
    </div>
  );
}

export default MenuManagement;