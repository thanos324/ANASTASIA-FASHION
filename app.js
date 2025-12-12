// =========================
//  GLOBALS
// =========================
let cartAnimation = null;

// Τρέχει μόλις φορτώσει η HTML
document.addEventListener('DOMContentLoaded', () => {
  console.log('✅ Η σελίδα φόρτωσε, τρέχει το app.js');

  setupHeroTransition();
  setupCategoryFilters();

  // Εκκίνηση συστήματος animation για το καλάθι (fly-to-cart)
  cartAnimation = new CartAnimation();

  // Εκκίνηση popup καλαθιού + checkout + messages
  setupCartPopup();
});

// =========================
//  1) HERO / OVERLAY + ANIMATION
// =========================
function setupHeroTransition() {
  const introOverlay = document.getElementById('intro-overlay');
  const heroButton   = document.querySelector('.hero-btn');
  const siteMain     = document.querySelector('main');

  if (!introOverlay || !heroButton || !siteMain) {
    console.warn('⚠️ Λείπει κάποιο στοιχείο (intro-overlay / hero-btn / main)');
    return;
  }

  heroButton.addEventListener('click', (event) => {
    event.preventDefault();
    console.log('🩷 Κλικ στο hero button');

    const hero = document.querySelector('.hero');
    if (hero) {
      hero.classList.add('hero-exit');
    }

    setTimeout(() => {
      console.log('✨ Κρύβω overlay και δείχνω main');

      introOverlay.classList.add('intro-hide');

      siteMain.classList.remove('site-hidden');
      siteMain.classList.add('site-visible');

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });

      const productCards = document.querySelectorAll('.product-card');
      productCards.forEach((card, index) => {
        card.classList.add('card-animate-in');
        card.style.animationDelay = `${index * 80}ms`;
      });

    }, 700);
  });
}

// =========================
//  2) CATEGORY FILTERS
// =========================
function setupCategoryFilters() {
  const filterButtons = document.querySelectorAll('.filter-btn[data-filter]');
  const productCards  = document.querySelectorAll('.product-card');

  if (!filterButtons.length || !productCards.length) {
    console.warn('⚠️ Δεν βρήκα φίλτρα ή προϊόντα για filtering');
    return;
  }

  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      productCards.forEach(card => {
        const cat = card.dataset.category;

        if (filter === 'all' || cat === filter) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

// =========================
//  3) ADD-TO-CART ANIMATION (CartAnimation)
// =========================
class CartAnimation {
  constructor() {
    this.cartCount   = 0;
    this.isAnimating = false;
    this.lastClickedButton = null;
    this.attachButtons();
  }

  attachButtons() {
    const buttons = document.querySelectorAll('.product-card button');

    if (!buttons.length) {
      console.warn('⚠️ Δεν βρήκα κουμπιά κάρτας για add-to-cart');
      return;
    }

    buttons.forEach((button) => {
      button.addEventListener('click', (e) => {
        e.preventDefault();

        const productCard = button.closest('.product-card');
        if (!productCard) return;

        if (!productCard.dataset.id) {
          productCard.dataset.id = 'product-' + Math.random().toString(36).substr(2, 9);
        }

        const productId = productCard.dataset.id;
        this.animateAddToCart(productId, button);
      });
    });
  }

  animateAddToCart(productId, sourceElement) {
    if (this.isAnimating) return;
    this.isAnimating = true;

    const cartIcon = document.getElementById('cart-icon');
    const source = sourceElement || document.querySelector(`[data-id="${productId}"]`);
    if (!source || !cartIcon) {
      this.isAnimating = false;
      return;
    }

    const flyingItem = this.createFlyingItem(source);

    const startPos     = this.getElementCenter(source);
    const endPos       = this.getElementCenter(cartIcon);
    const controlPoint = this.calculateControlPoint(startPos, endPos);

    document.body.appendChild(flyingItem);

    this.animateBezier(
      flyingItem,
      800,
      startPos,
      controlPoint,
      endPos
    ).then(() => {
      this.triggerCartHitEffect(cartIcon);
      this.spawnParticlesAroundCart(cartIcon);
      this.updateCartCount();

      setTimeout(() => {
        if (flyingItem.parentNode) {
          flyingItem.parentNode.removeChild(flyingItem);
        }
        this.isAnimating = false;
      }, 100);
    });
  }

  createFlyingItem(sourceElement) {
    const item = document.createElement('div');
    item.className = 'flying-item glow';

    const productImg = sourceElement.closest('.product-card')?.querySelector('img');
    if (productImg) {
      item.style.backgroundImage = `url(${productImg.src})`;
      item.style.backgroundSize = 'cover';
      item.style.backgroundPosition = 'center';
    }

    item.style.transform = 'scale(1)';
    return item;
  }

  calculateControlPoint(start, end) {
    const distanceX = end.x - start.x;

    return {
      x: start.x + distanceX * 0.5,
      y: Math.min(start.y, end.y) - Math.abs(distanceX) * 0.3 - 100
    };
  }

  animateBezier(element, duration, p0, p1, p2) {
    return new Promise((resolve) => {
      const startTime = performance.now();

      const animate = (currentTime) => {
        const elapsed  = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const t        = progress;
        const oneMinusT = 1 - t;

        const x =
          oneMinusT * oneMinusT * p0.x +
          2 * oneMinusT * t * p1.x +
          t * t * p2.x;

        const y =
          oneMinusT * oneMinusT * p0.y +
          2 * oneMinusT * t * p1.y +
          t * t * p2.y;

        element.style.transform =
          `translate3d(${x - 20}px, ${y - 20}px, 0) scale(${1 - progress * 0.5})`;
        element.style.opacity = 1 - progress * 0.7;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  triggerCartHitEffect(cartIcon) {
    cartIcon.classList.add('shake');

    setTimeout(() => {
      cartIcon.classList.remove('shake');
      cartIcon.classList.add('bounce');

      cartIcon.style.color = '#e07a5f';
      setTimeout(() => {
        cartIcon.style.color = '';
      }, 300);

      setTimeout(() => {
        cartIcon.classList.remove('bounce');
      }, 300);
    }, 500);
  }

  spawnParticlesAroundCart(cartIcon) {
    const cartPos = this.getElementCenter(cartIcon);
    const colors  = ['gold', 'red', 'blue', 'pink'];

    for (let i = 0; i < 12; i++) {
      setTimeout(() => {
        const particle = document.createElement('div');
        particle.className = `particle ${colors[i % colors.length]}`;

        document.body.appendChild(particle);

        const angle    = Math.random() * Math.PI * 2;
        const distance = 30 + Math.random() * 50;
        const duration = 400 + Math.random() * 300;

        particle.style.left    = `${cartPos.x - 4}px`;
        particle.style.top     = `${cartPos.y - 4}px`;
        particle.style.opacity = '1';

        const startTime = performance.now();

        const animateParticle = (currentTime) => {
          const elapsed  = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);

          const x = cartPos.x + Math.cos(angle) * distance * progress;
          const y = cartPos.y + Math.sin(angle) * distance * progress
                    - 50 * progress * (1 - progress);

          particle.style.transform = `translate3d(${x}px, ${y}px, 0)`;
          particle.style.opacity   = 1 - progress;

          if (progress < 1) {
            requestAnimationFrame(animateParticle);
          } else {
            if (particle.parentNode) {
              particle.parentNode.removeChild(particle);
            }
          }
        };

        requestAnimationFrame(animateParticle);
      }, i * 30);
    }
  }

  updateCartCount() {
    this.cartCount++;
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
      cartCountElement.style.transform = 'scale(1.5)';
      cartCountElement.textContent    = this.cartCount;
      setTimeout(() => {
        cartCountElement.style.transform = 'scale(1)';
      }, 300);
    }
  }

  getElementCenter(element) {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left + rect.width  / 2,
      y: rect.top  + rect.height / 2
    };
  }
}

// =========================
//  4) CART POPUP + CHECKOUT + MESSAGE POPUP
// =========================
const cartState = {
  items: [],
  totalItems: 0,
  totalPrice: 0
};

function setupCartPopup() {
  const cartIcon      = document.getElementById('cart-icon');
  const cartClose     = document.getElementById('cart-close');
  const cartOverlay   = document.getElementById('cart-overlay');
  const cartPopup     = document.getElementById('cart-popup');
  const checkoutBtn   = document.getElementById('checkout-btn');

  // 2ο popup
  const checkoutPopup   = document.getElementById('checkout-popup');
  const checkoutClose   = document.getElementById('checkout-close');
  const checkoutConfirm = document.getElementById('checkout-confirm');
  const checkoutForm    = document.getElementById('checkout-form');

  // 3ο popup (μηνύματα)
  const messagePopup = document.getElementById('message-popup');
  const messageClose = document.getElementById('message-close');
  const messageOk    = document.getElementById('message-ok');

  if (!cartIcon || !cartClose || !cartOverlay || !cartPopup) {
    console.warn('⚠️ Λείπουν στοιχεία του cart popup');
    return;
  }

  // Άνοιγμα popup όταν πατιέται το καλάθι
  cartIcon.addEventListener('click', (e) => {
    e.preventDefault();
    openCartPopup();
  });

  // Χ στο popup καλαθιού
  cartClose.addEventListener('click', closeAllPopups);

  // Overlay κλείνει ό,τι είναι ανοιχτό
  cartOverlay.addEventListener('click', closeAllPopups);

  // Checkout από ΤΟ ΚΑΛΑΘΙ → άνοιγμα 2ου popup
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (cartState.items.length === 0) {
        showError('Το καλάθι σου είναι άδειο. Πρόσθεσε τουλάχιστον ένα προϊόν για να συνεχίσεις.');
        return;
      }

      openCheckoutPopup();

      const checkoutTotal = document.getElementById('checkout-total');
      if (checkoutTotal) {
        checkoutTotal.textContent =
          cartState.totalPrice.toFixed(2).replace('.', ',') + ' €';
      }
    });
  }

  // Χ στο 2ο popup
  if (checkoutClose) {
    checkoutClose.addEventListener('click', closeAllPopups);
  }

  // Επιβεβαίωση παραγγελίας
  if (checkoutConfirm && checkoutForm) {
    checkoutConfirm.addEventListener('click', () => {
      const requiredIds = ['first-name', 'last-name', 'address1', 'postcode', 'phone', 'email'];
      let missing = [];

      requiredIds.forEach(id => {
        const input = document.getElementById(id);
        if (!input || !input.value.trim()) {
          missing.push(id);
          if (input) input.classList.add('invalid');
        } else {
          input.classList.remove('invalid');
        }
      });

      if (missing.length > 0) {
        showError('Συμπλήρωσε όλα τα υποχρεωτικά πεδία πριν συνεχίσεις.');
        return;
      }

      const nameInput   = document.getElementById('first-name');
      const displayName = nameInput ? nameInput.value.trim() : '';

      clearCart();
      checkoutForm.reset();

      showSuccess(
        `Η παραγγελία σου καταχωρήθηκε επιτυχώς${displayName ? ', ' + displayName : ''}.\n` +
        'Θα επικοινωνήσουμε σύντομα μαζί σου στα στοιχεία που δήλωσες.'
      );
    });
  }

  // Μηνυματικό popup – Χ και ΟΚ
  if (messageClose) {
    messageClose.addEventListener('click', closeAllPopups);
  }
  if (messageOk) {
    messageOk.addEventListener('click', closeAllPopups);
  }

  // Κλείσιμο με ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const anyOpen =
        cartPopup.classList.contains('active') ||
        (checkoutPopup && checkoutPopup.classList.contains('active')) ||
        (messagePopup && messagePopup.classList.contains('active'));
      if (anyOpen) {
        closeAllPopups();
      }
    }
  });
}

function openCartPopup() {
  const cartOverlay   = document.getElementById('cart-overlay');
  const cartPopup     = document.getElementById('cart-popup');
  const checkoutPopup = document.getElementById('checkout-popup');
  const messagePopup  = document.getElementById('message-popup');

  if (!cartOverlay || !cartPopup) return;

  if (checkoutPopup) checkoutPopup.classList.remove('active');
  if (messagePopup)  messagePopup.classList.remove('active');

  cartOverlay.classList.add('active');
  cartPopup.classList.add('active');
  document.body.style.overflow = 'hidden';

  updateCartPopup();
}

// για συμβατότητα – απλά κλείνει τα πάντα
function closeCartPopup() {
  closeAllPopups();
}

function openCheckoutPopup() {
  const cartOverlay   = document.getElementById('cart-overlay');
  const cartPopup     = document.getElementById('cart-popup');
  const checkoutPopup = document.getElementById('checkout-popup');
  const messagePopup  = document.getElementById('message-popup');

  if (!cartOverlay || !checkoutPopup) return;

  if (cartPopup)    cartPopup.classList.remove('active');
  if (messagePopup) messagePopup.classList.remove('active');

  cartOverlay.classList.add('active');
  checkoutPopup.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeAllPopups() {
  const cartOverlay   = document.getElementById('cart-overlay');
  const cartPopup     = document.getElementById('cart-popup');
  const checkoutPopup = document.getElementById('checkout-popup');
  const messagePopup  = document.getElementById('message-popup');

  if (cartPopup)     cartPopup.classList.remove('active');
  if (checkoutPopup) checkoutPopup.classList.remove('active');
  if (messagePopup)  messagePopup.classList.remove('active');
  if (cartOverlay)   cartOverlay.classList.remove('active');

  document.body.style.overflow = '';
}

function addToCart(productCard) {
  const productId    = productCard.dataset.id;
  const productName  = productCard.querySelector('h3').textContent;
  const priceText    = productCard.querySelector('.price').textContent;
  const productImage = productCard.querySelector('img').src;

  const productPrice = parseFloat(
    priceText.replace('€', '').replace(',', '.').trim()
  );

  const existingItem = cartState.items.find(item => item.id === productId);

  if (existingItem) {
    existingItem.quantity += 1;
    existingItem.total = existingItem.quantity * existingItem.price;
  } else {
    cartState.items.push({
      id: productId,
      name: productName,
      price: productPrice,
      image: productImage,
      quantity: 1,
      total: productPrice
    });
  }

  updateCartTotals();
  updateCartBadge();

  const cartPopup = document.getElementById('cart-popup');
  if (cartPopup && cartPopup.classList.contains('active')) {
    updateCartPopup();
  }
}

function updateCartTotals() {
  cartState.totalItems = cartState.items.reduce((sum, item) => sum + item.quantity, 0);
  cartState.totalPrice = cartState.items.reduce((sum, item) => sum + item.total, 0);
}

function updateCartPopup() {
  const cartItemsContainer = document.getElementById('cart-items');
  const cartTotalElement   = document.getElementById('cart-total');

  if (!cartItemsContainer) return;

  if (cartState.items.length === 0) {
    cartItemsContainer.innerHTML = `
      <div class="cart-empty">
        <i class="fa-solid fa-cart-arrow-down"></i>
        <p>Το καλάθι σου είναι άδειο</p>
      </div>
    `;
  } else {
    cartItemsContainer.innerHTML = cartState.items.map(item => `
      <div class="cart-item" data-id="${item.id}">
        <div class="cart-item-image">
          <img src="${item.image}" alt="${item.name}">
        </div>
        <div class="cart-item-info">
          <div class="cart-item-title">${item.name}</div>
          <div class="cart-item-price">${item.price.toFixed(2)} €</div>
        </div>
        <div class="cart-item-controls">
          <div class="cart-item-quantity">
            <button class="quantity-btn minus" onclick="updateQuantity('${item.id}', -1)">−</button>
            <span>${item.quantity}</span>
            <button class="quantity-btn plus" onclick="updateQuantity('${item.id}', 1)">+</button>
          </div>
          <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    `).join('');
  }

  if (cartTotalElement) {
    cartTotalElement.textContent =
      cartState.totalPrice.toFixed(2).replace('.', ',') + ' €';
  }
}

function updateQuantity(productId, change) {
  const item = cartState.items.find(item => item.id === productId);
  if (!item) return;

  item.quantity += change;

  if (item.quantity < 1) {
    cartState.items = cartState.items.filter(i => i.id !== productId);
  } else {
    item.total = item.quantity * item.price;
  }

  updateCartTotals();
  updateCartPopup();
  updateCartBadge();
}

function removeFromCart(productId) {
  cartState.items = cartState.items.filter(item => item.id !== productId);
  updateCartTotals();
  updateCartPopup();
  updateCartBadge();
}

function updateCartBadge() {
  const cartCountElement = document.getElementById('cart-count');
  if (!cartCountElement) return;

  cartCountElement.textContent = cartState.totalItems;
  cartCountElement.style.transform = 'scale(1.3)';
  setTimeout(() => {
    cartCountElement.style.transform = 'scale(1)';
  }, 200);
}

function clearCart() {
  cartState.items = [];
  updateCartTotals();
  updateCartBadge();
  updateCartPopup();
}

// =========================
//  5) MESSAGE POPUP HELPERS
// =========================
function openMessagePopup({ title, message, type = 'success' }) {
  const cartOverlay  = document.getElementById('cart-overlay');
  const messagePopup = document.getElementById('message-popup');
  const titleEl      = document.getElementById('message-title');
  const textEl       = document.getElementById('message-text');

  const cartPopup     = document.getElementById('cart-popup');
  const checkoutPopup = document.getElementById('checkout-popup');

  if (!cartOverlay || !messagePopup || !titleEl || !textEl) return;

  // κλείσε άλλα popups
  if (cartPopup)     cartPopup.classList.remove('active');
  if (checkoutPopup) checkoutPopup.classList.remove('active');

  // set classes
  messagePopup.classList.remove('success', 'error');
  messagePopup.classList.add(type === 'error' ? 'error' : 'success');

  // τίτλος + icon
  const iconClass = type === 'error'
    ? 'fa-solid fa-circle-exclamation'
    : 'fa-solid fa-circle-check';

  titleEl.innerHTML = `<i class="${iconClass}"></i> ${title}`;

  // κείμενο
  textEl.textContent = message;

  cartOverlay.classList.add('active');
  messagePopup.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function showError(message) {
  openMessagePopup({
    title: 'Σφάλμα',
    message,
    type: 'error'
  });
}

function showSuccess(message) {
  openMessagePopup({
    title: 'Ευχαριστούμε για την παραγγελία σας',
    message,
    type: 'success'
  });
}

// =========================
//  Override CartAnimation
// =========================
const originalUpdateCartCount = CartAnimation.prototype.updateCartCount;

CartAnimation.prototype.updateCartCount = function() {
  this.cartCount++;
  const cartCountElement = document.getElementById('cart-count');
  if (cartCountElement) {
    cartCountElement.style.transform = 'scale(1.5)';
    cartCountElement.textContent = this.cartCount;
    setTimeout(() => {
      cartCountElement.style.transform = 'scale(1)';
    }, 300);
  }

  const clickedButton = this.lastClickedButton;
  if (clickedButton) {
    const productCard = clickedButton.closest('.product-card');
    if (productCard) {
      addToCart(productCard);
    }
  }
};

const originalAnimateAddToCart = CartAnimation.prototype.animateAddToCart;

CartAnimation.prototype.animateAddToCart = function(productId, sourceElement) {
  this.lastClickedButton = sourceElement;
  return originalAnimateAddToCart.call(this, productId, sourceElement);
};

