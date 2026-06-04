// App State
let products = [];
let cart = [];

// DOM Elements
const productsGrid = document.getElementById('products-grid');
const categoryFilter = document.getElementById('category-filter');
const textFilter = document.getElementById('text-filter');
const cartToggleBtn = document.getElementById('cart-toggle');
const closeCartBtn = document.getElementById('close-cart');
const cartSidebar = document.getElementById('cart-sidebar');
const cartOverlay = document.getElementById('cart-overlay');
const cartItemsContainer = document.getElementById('cart-items');
const cartCountEl = document.getElementById('cart-count');
const cartTotalPriceEl = document.getElementById('cart-total-price');
const btnCheckout = document.getElementById('btn-checkout');
const productModal = document.getElementById('product-modal');
const closeModalBtn = document.getElementById('close-modal');
const modalBody = document.getElementById('modal-body');

// Base URL for Images
const IMAGE_BASE_URL = 'https://senda.nutrizonecr.com';
const WHATSAPP_NUMBER = '50670334421';

// Init App
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    setupEventListeners();
});

// Fetch products from JSON
async function fetchProducts() {
    try {
        const response = await fetch('./config/json-config.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // Filter active products
        products = data.filter(product => product.is_active);
        populateCategoryFilter();
        renderProducts();
    } catch (error) {
        console.error("Error fetching products:", error);
        productsGrid.innerHTML = '<div class="error-message">Error al cargar los productos. Por favor, intente más tarde.</div>';
    }
}

// Format Currency (Colones)
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CR', {
        style: 'currency',
        currency: 'CRC',
        minimumFractionDigits: 0
    }).format(amount);
}

function populateCategoryFilter() {
    if (!categoryFilter) return;
    const categories = [...new Set(products.map(p => p.category))];
    
    categoryFilter.innerHTML = '<option value="all">Todas las Categorías</option>';
    
    categories.forEach(cat => {
        if (!cat) return;
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categoryFilter.appendChild(option);
    });
}

// Render Products Grid
function renderProducts() {
    productsGrid.innerHTML = '';
    
    const category = categoryFilter ? categoryFilter.value : 'all';
    const searchText = textFilter ? textFilter.value.toLowerCase().trim() : '';

    const filteredProducts = products.filter(p => {
        const matchesCategory = category === 'all' || p.category === category;
        
        let matchesText = true;
        if (searchText) {
            const nameMatch = p.name ? p.name.toLowerCase().includes(searchText) : false;
            const brandMatch = p.brand ? p.brand.toLowerCase().includes(searchText) : false;
            const descMatch = p.description ? p.description.toLowerCase().includes(searchText) : false;
            matchesText = nameMatch || brandMatch || descMatch;
        }

        return matchesCategory && matchesText;
    });
    
    if (filteredProducts.length === 0) {
        productsGrid.innerHTML = '<div class="empty-message">No se encontraron productos con esos filtros.</div>';
        return;
    }

    filteredProducts.forEach(product => {
        const imageUrl = product.image_url ? `${IMAGE_BASE_URL}${product.image_url}` : 'assets/placeholder.png';
        
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${imageUrl}" alt="${product.name}" class="product-image" data-sku="${product.sku}" onerror="this.src='assets/placeholder.png'">
            <div class="product-info">
                <span class="product-brand">${product.brand}</span>
                <h3 class="product-name" data-sku="${product.sku}">${product.name}</h3>
                <span class="product-category">${product.category}</span>
                <div class="product-price">${formatCurrency(product.price)}</div>
                
                <div class="product-actions">
                    <div class="quantity-selector">
                        <button type="button" class="qty-btn dec" data-sku="${product.sku}">-</button>
                        <input type="number" class="qty-input" id="qty-${product.sku}" value="1" min="1" max="${product.stock}">
                        <button type="button" class="qty-btn inc" data-sku="${product.sku}">+</button>
                    </div>
                    <button type="button" class="btn-add-cart" data-sku="${product.sku}">
                        <i class="fa-solid fa-cart-plus"></i> Agregar al Carrito
                    </button>
                </div>
            </div>
        `;
        productsGrid.appendChild(card);
    });

    // Add event listeners for new elements
    document.querySelectorAll('.qty-btn.inc').forEach(btn => {
        btn.addEventListener('click', (e) => updateInputQuantity(e.target.dataset.sku, 1));
    });
    
    document.querySelectorAll('.qty-btn.dec').forEach(btn => {
        btn.addEventListener('click', (e) => updateInputQuantity(e.target.dataset.sku, -1));
    });

    document.querySelectorAll('.btn-add-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const sku = e.currentTarget.dataset.sku;
            const qty = parseInt(document.getElementById(`qty-${sku}`).value);
            addToCart(sku, qty);
        });
    });

    // Open modal when clicking image or name
    document.querySelectorAll('.product-image, .product-name').forEach(el => {
        el.addEventListener('click', (e) => {
            openProductModal(e.target.dataset.sku);
        });
    });
}

function updateInputQuantity(sku, change) {
    const input = document.getElementById(`qty-${sku}`);
    let currentValue = parseInt(input.value);
    const product = products.find(p => p.sku === sku);
    
    let newValue = currentValue + change;
    if (newValue < 1) newValue = 1;
    if (newValue > product.stock) newValue = product.stock;
    
    input.value = newValue;
}

// Cart Logic
function addToCart(sku, quantity) {
    const product = products.find(p => p.sku === sku);
    if (!product) return;

    const existingItem = cart.find(item => item.sku === sku);
    
    if (existingItem) {
        let newQty = existingItem.quantity + quantity;
        if (newQty > product.stock) newQty = product.stock;
        existingItem.quantity = newQty;
    } else {
        cart.push({
            ...product,
            quantity: quantity
        });
    }

    updateCartUI();
    openCart();
    
    // Reset input
    const input = document.getElementById(`qty-${sku}`);
    if(input) input.value = 1;
}

function removeFromCart(sku) {
    cart = cart.filter(item => item.sku !== sku);
    updateCartUI();
}

function updateCartItemQuantity(sku, change) {
    const item = cart.find(i => i.sku === sku);
    if (!item) return;
    
    let newQty = item.quantity + change;
    if (newQty < 1) {
        removeFromCart(sku);
        return;
    }
    
    if (newQty > item.stock) newQty = item.stock;
    item.quantity = newQty;
    updateCartUI();
}

function updateCartUI() {
    // Update count
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountEl.textContent = totalItems;

    // Render items
    cartItemsContainer.innerHTML = '';
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<div class="empty-cart-message">Tu carrito está vacío</div>';
        cartTotalPriceEl.textContent = '₡0';
        return;
    }

    let totalPrice = 0;

    cart.forEach(item => {
        totalPrice += item.price * item.quantity;
        const imageUrl = item.image_url ? `${IMAGE_BASE_URL}${item.image_url}` : 'assets/placeholder.png';
        
        const itemEl = document.createElement('div');
        itemEl.className = 'cart-item';
        itemEl.innerHTML = `
            <img src="${imageUrl}" alt="${item.name}" class="cart-item-img" onerror="this.src='assets/placeholder.png'">
            <div class="cart-item-details">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-price">${formatCurrency(item.price)}</div>
                <div class="cart-item-actions">
                    <div class="cart-item-qty">
                        <button type="button" class="cart-dec" data-sku="${item.sku}">-</button>
                        <input type="text" value="${item.quantity}" readonly>
                        <button type="button" class="cart-inc" data-sku="${item.sku}">+</button>
                    </div>
                    <button type="button" class="remove-item" data-sku="${item.sku}">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        cartItemsContainer.appendChild(itemEl);
    });

    cartTotalPriceEl.textContent = formatCurrency(totalPrice);

    // Add event listeners to cart items
    document.querySelectorAll('.cart-inc').forEach(btn => {
        btn.addEventListener('click', (e) => updateCartItemQuantity(e.currentTarget.dataset.sku, 1));
    });
    
    document.querySelectorAll('.cart-dec').forEach(btn => {
        btn.addEventListener('click', (e) => updateCartItemQuantity(e.currentTarget.dataset.sku, -1));
    });

    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', (e) => removeFromCart(e.currentTarget.dataset.sku));
    });
}

// Sidebar Cart Display
function openCart() {
    cartSidebar.classList.add('open');
    cartOverlay.classList.add('show');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function closeCart() {
    cartSidebar.classList.remove('open');
    cartOverlay.classList.remove('show');
    document.body.style.overflow = '';
}

// Product Modal Display
function openProductModal(sku) {
    const product = products.find(p => p.sku === sku);
    if (!product) return;

    const imageUrl = product.image_url ? `${IMAGE_BASE_URL}${product.image_url}` : 'assets/placeholder.png';
    
    // Convert newlines to <br> for HTML rendering
    const formattedDescription = product.description ? product.description.replace(/\n/g, '<br>') : 'Sin descripción disponible.';

    modalBody.innerHTML = `
        <div class="modal-top-section">
            <div class="modal-image-container">
                <img src="${imageUrl}" alt="${product.name}" onerror="this.src='assets/placeholder.png'">
            </div>
            <div class="modal-essential-details">
                <div class="modal-brand">${product.brand}</div>
                <h2>${product.name}</h2>
                <div class="modal-price">${formatCurrency(product.price)}</div>
                
                <div class="modal-actions" style="margin-bottom: 20px;">
                    <button type="button" class="btn-add-cart" data-sku="${product.sku}" onclick="addToCart('${product.sku}', 1); closeProductModal();">
                        <i class="fa-solid fa-cart-plus"></i> Agregar al Carrito
                    </button>
                </div>
            </div>
        </div>
        <div class="modal-description-section">
            <h3>Acerca de este producto</h3>
            <div class="modal-description">${formattedDescription}</div>
        </div>
    `;

    productModal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeProductModal() {
    productModal.classList.remove('show');
    document.body.style.overflow = '';
}

// WhatsApp Checkout
function checkoutWhatsApp() {
    if (cart.length === 0) {
        alert("Tu carrito está vacío.");
        return;
    }

    let message = "Hola NutriZone! 👋\nMe gustaría realizar el siguiente pedido:\n\n";
    let total = 0;

    cart.forEach(item => {
        const subtotal = item.price * item.quantity;
        total += subtotal;
        message += `✅ ${item.quantity}x ${item.name} - ${formatCurrency(item.price)} c/u\n`;
    });

    message += `\n*Total estimado: ${formatCurrency(total)}*\n\n`;
    message += "Por favor, indíquenme los pasos para completar la compra. ¡Gracias!";

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
}

// Event Listeners setup
function setupEventListeners() {
    cartToggleBtn.addEventListener('click', openCart);
    closeCartBtn.addEventListener('click', closeCart);
    cartOverlay.addEventListener('click', () => {
        closeCart();
        closeProductModal();
    });
    
    closeModalBtn.addEventListener('click', closeProductModal);
    
    // Close modal on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeCart();
            closeProductModal();
        }
    });

    btnCheckout.addEventListener('click', checkoutWhatsApp);

    if (categoryFilter) {
        categoryFilter.addEventListener('change', renderProducts);
    }
    
    if (textFilter) {
        textFilter.addEventListener('input', renderProducts);
    }
}
