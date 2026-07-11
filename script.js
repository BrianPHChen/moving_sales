(function () {
  const gallery = document.getElementById("gallery");
  const searchInput = document.getElementById("search");
  const sortSelect = document.getElementById("sort");
  const hideSoldCheckbox = document.getElementById("hide-sold");
  const countEl = document.getElementById("item-count");
  const lastUpdatedEl = document.getElementById("last-updated");
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxClose = document.getElementById("lightbox-close");
  const lightboxPrev = document.getElementById("lightbox-prev");
  const lightboxNext = document.getElementById("lightbox-next");

  const items = Array.isArray(window.MOVING_SALE_ITEMS) ? window.MOVING_SALE_ITEMS : [];

  if (window.MOVING_SALE_LAST_UPDATED) {
    const updatedDate = new Date(window.MOVING_SALE_LAST_UPDATED);
    lastUpdatedEl.textContent =
      "Last updated: " +
      updatedDate.toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
  }

  function money(n) {
    return n === 0 ? "FREE" : "$" + Number(n).toLocaleString("en-US");
  }

  function effectivePrice(o) {
    return o.salePrice != null ? o.salePrice : o.price;
  }

  function cardMinPrice(item) {
    const prices = item.objects
      .filter((o) => !o.sold)
      .map(effectivePrice)
      .filter((p) => p != null);
    if (prices.length === 0) {
      const all = item.objects.map(effectivePrice).filter((p) => p != null);
      return all.length === 0 ? Infinity : Math.min(...all);
    }
    return Math.min(...prices);
  }

  function cardMatchesSearch(item, query) {
    if (!query) return true;
    const haystack = (
      item.objects.map((o) => o.name + " " + o.description).join(" ")
    ).toLowerCase();
    return haystack.includes(query);
  }

  function allSold(item) {
    return item.objects.every((o) => o.sold);
  }

  let pendingDescToggles = [];

  function setupDescToggles() {
    pendingDescToggles.forEach((desc) => {
      if (desc.scrollHeight <= desc.clientHeight + 1) return;
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "desc-toggle";
      toggle.textContent = "Show more";
      toggle.addEventListener("click", () => {
        const expanded = desc.classList.toggle("expanded");
        toggle.textContent = expanded ? "Show less" : "Show more";
      });
      desc.insertAdjacentElement("afterend", toggle);
    });
    pendingDescToggles = [];
  }

  function render() {
    const query = searchInput.value.trim().toLowerCase();
    const hideSold = hideSoldCheckbox.checked;
    const sortMode = sortSelect.value;

    let visible = items.filter((item) => cardMatchesSearch(item, query));
    if (hideSold) {
      visible = visible.filter((item) => !allSold(item));
    }

    visible = visible.slice();
    if (sortMode === "price-asc") {
      visible.sort((a, b) => cardMinPrice(a) - cardMinPrice(b));
    } else if (sortMode === "price-desc") {
      visible.sort((a, b) => cardMinPrice(b) - cardMinPrice(a));
    } else if (sortMode === "name-asc") {
      visible.sort((a, b) =>
        a.objects[0].name.localeCompare(b.objects[0].name)
      );
    }

    gallery.innerHTML = "";

    if (visible.length === 0) {
      const empty = document.createElement("p");
      empty.className = "no-results";
      empty.textContent = "No items match your search.";
      gallery.appendChild(empty);
    } else {
      visible.forEach((item) => gallery.appendChild(renderCard(item)));
      setupDescToggles();
    }

    const totalObjects = items.reduce((sum, i) => sum + i.objects.length, 0);
    const soldObjects = items.reduce(
      (sum, i) => sum + i.objects.filter((o) => o.sold).length,
      0
    );
    countEl.textContent =
      totalObjects +
      " items listed (" +
      (totalObjects - soldObjects) +
      " available, " +
      soldObjects +
      " sold)";
  }

  function renderCard(item) {
    const card = document.createElement("div");
    card.className = "card";
    const alt = item.objects.map((o) => o.name).join(", ");

    const photoWrap = document.createElement("div");
    photoWrap.className = "card-photo-wrap";

    const img = document.createElement("img");
    img.className = "card-photo";
    img.src = item.images[0];
    img.alt = alt;
    img.loading = "lazy";
    let photoIndex = 0;
    img.addEventListener("click", () => openLightbox(item.images, photoIndex, alt));
    photoWrap.appendChild(img);

    if (item.images.length > 1) {
      const prev = document.createElement("button");
      prev.className = "photo-nav photo-nav-prev";
      prev.type = "button";
      prev.textContent = "‹";
      prev.setAttribute("aria-label", "Previous photo");

      const next = document.createElement("button");
      next.className = "photo-nav photo-nav-next";
      next.type = "button";
      next.textContent = "›";
      next.setAttribute("aria-label", "Next photo");

      const dots = document.createElement("div");
      dots.className = "photo-dots";
      item.images.forEach((_, i) => {
        const dot = document.createElement("span");
        dot.className = "photo-dot" + (i === 0 ? " active" : "");
        dots.appendChild(dot);
      });

      function showPhoto(i) {
        photoIndex = (i + item.images.length) % item.images.length;
        img.src = item.images[photoIndex];
        [...dots.children].forEach((d, di) =>
          d.classList.toggle("active", di === photoIndex)
        );
      }

      prev.addEventListener("click", (e) => {
        e.stopPropagation();
        showPhoto(photoIndex - 1);
      });
      next.addEventListener("click", (e) => {
        e.stopPropagation();
        showPhoto(photoIndex + 1);
      });

      photoWrap.appendChild(prev);
      photoWrap.appendChild(next);
      photoWrap.appendChild(dots);
    }

    card.appendChild(photoWrap);

    const body = document.createElement("div");
    body.className = "card-body";

    item.objects.forEach((obj) => {
      const row = document.createElement("div");
      row.className = "object-row" + (obj.sold ? " sold" : "");

      const info = document.createElement("div");
      info.className = "object-info";

      const name = document.createElement("p");
      name.className = "object-name";
      name.textContent = obj.name;
      if (obj.sold) {
        const badge = document.createElement("span");
        badge.className = "sold-badge";
        badge.textContent = "SOLD";
        name.appendChild(badge);
      }
      info.appendChild(name);

      if (obj.description) {
        const desc = document.createElement("p");
        desc.className = "object-desc";
        desc.textContent = obj.description;
        info.appendChild(desc);
        pendingDescToggles.push(desc);
      }

      if (obj.size) {
        const size = document.createElement("p");
        size.className = "object-size";
        size.textContent = "Size: " + obj.size;
        info.appendChild(size);
      }

      if (obj.link) {
        const link = document.createElement("a");
        link.className = "object-link";
        link.href = obj.link;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "View original listing";
        info.appendChild(link);
      }

      if (Array.isArray(obj.links)) {
        const list = document.createElement("ul");
        list.className = "object-links";
        obj.links.forEach((l) => {
          const item = document.createElement("li");
          const link = document.createElement("a");
          link.className = "object-link";
          link.href = l.url;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.textContent = l.label || "View original listing";
          item.appendChild(link);
          list.appendChild(item);
        });
        info.appendChild(list);
      }

      const priceWrap = document.createElement("div");
      priceWrap.className = "object-price-wrap";

      if (obj.originalPrice != null) {
        const retail = document.createElement("div");
        retail.className = "original-price";
        retail.textContent = "Retail " + money(obj.originalPrice);
        priceWrap.appendChild(retail);
      } else if (obj.salePrice != null) {
        const original = document.createElement("div");
        original.className = "original-price";
        original.textContent = money(obj.price);
        priceWrap.appendChild(original);
      }

      const price = document.createElement("div");
      price.className = "object-price";
      const effPrice = obj.salePrice != null ? obj.salePrice : obj.price;
      if (effPrice === 0) price.classList.add("free-price");
      price.textContent = effPrice != null ? money(effPrice) : "Price TBD";
      priceWrap.appendChild(price);

      row.appendChild(info);
      row.appendChild(priceWrap);
      body.appendChild(row);
    });

    card.appendChild(body);
    return card;
  }

  let lightboxImages = [];
  let lightboxIndex = 0;

  function openLightbox(images, startIndex, alt) {
    lightboxImages = images;
    lightboxIndex = startIndex;
    lightboxImg.alt = alt;
    const hasMultiple = lightboxImages.length > 1;
    lightboxPrev.classList.toggle("hidden", !hasMultiple);
    lightboxNext.classList.toggle("hidden", !hasMultiple);
    showLightboxImage();
    lightbox.classList.remove("hidden");
  }

  function showLightboxImage() {
    lightboxImg.src = lightboxImages[lightboxIndex];
  }

  function showLightboxPhoto(i) {
    lightboxIndex = (i + lightboxImages.length) % lightboxImages.length;
    showLightboxImage();
  }

  function closeLightbox() {
    lightbox.classList.add("hidden");
    lightboxImg.src = "";
  }

  lightboxClose.addEventListener("click", closeLightbox);
  lightboxPrev.addEventListener("click", (e) => {
    e.stopPropagation();
    showLightboxPhoto(lightboxIndex - 1);
  });
  lightboxNext.addEventListener("click", (e) => {
    e.stopPropagation();
    showLightboxPhoto(lightboxIndex + 1);
  });
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (lightbox.classList.contains("hidden")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight" && lightboxImages.length > 1) {
      showLightboxPhoto(lightboxIndex + 1);
    }
    if (e.key === "ArrowLeft" && lightboxImages.length > 1) {
      showLightboxPhoto(lightboxIndex - 1);
    }
  });

  searchInput.addEventListener("input", render);
  sortSelect.addEventListener("change", render);
  hideSoldCheckbox.addEventListener("change", render);

  render();
})();
