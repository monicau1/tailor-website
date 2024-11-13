// public/js/detail-pakaian-script.js

document.addEventListener("DOMContentLoaded", function () {
  // Form elements
  const formPakaian = document.getElementById("formPakaian");
  const ukuranSelect = document.querySelector('select[name="ukuran"]');
  const warnaSelect = document.querySelector('select[name="warna"]');
  const quantityInput = document.getElementById("quantity");
  const customSizeCheckbox = document.getElementById("customSize");
  const customSizeForm = document.getElementById("customSizeForm");
  const submitButton = document.querySelector('button[type="submit"]');
  const stokInfo = document.getElementById("stokInfo");

  // Custom Size Toggle
  customSizeCheckbox?.addEventListener("change", function () {
    if (customSizeForm) {
      customSizeForm.classList.toggle("d-none", !this.checked);
      if (ukuranSelect) {
        ukuranSelect.disabled = this.checked;
        ukuranSelect.required = !this.checked;
      }
    }
  });

  // Check Stock Function
  async function checkStock() {
    if (!ukuranSelect || !warnaSelect || !stokInfo || !submitButton) return;

    const ukuran = ukuranSelect.value;
    const warna = warnaSelect.value;

    // Reset state
    stokInfo.innerHTML = "";
    submitButton.disabled = true;

    // If using custom size
    if (customSizeCheckbox?.checked) {
      stokInfo.innerHTML = `
        <div class="alert alert-info">
          Pesanan dengan ukuran khusus
        </div>
      `;
      submitButton.disabled = false;
      return;
    }

    // Check stock only if both size and color are selected
    if (ukuran && warna) {
      try {
        const idPakaian = formPakaian.dataset.idPakaian;
        const response = await fetch(
          `/pakaian/check-stock/${idPakaian}?ukuran=${ukuran}&warna=${warna}`
        );
        const data = await response.json();

        if (data.stok > 0) {
          stokInfo.innerHTML = `
            <div class="alert alert-success">
              Stok tersedia: ${data.stok}
            </div>
          `;
          submitButton.disabled = false;
          quantityInput.max = data.stok;
        } else {
          stokInfo.innerHTML = `
            <div class="alert alert-warning">
              Maaf, stok tidak tersedia
            </div>
          `;
        }
      } catch (error) {
        console.error("Error checking stock:", error);
        stokInfo.innerHTML = `
          <div class="alert alert-danger">
            Gagal mengecek stok
          </div>
        `;
      }
    }
  }

  // Add event listeners for stock checking
  ukuranSelect?.addEventListener("change", checkStock);
  warnaSelect?.addEventListener("change", checkStock);

  // Quantity Controls
  const decrementBtn = document.getElementById("decrementBtn");
  const incrementBtn = document.getElementById("incrementBtn");

  decrementBtn?.addEventListener("click", () => {
    const currentValue = parseInt(quantityInput.value);
    if (currentValue > 1) {
      quantityInput.value = currentValue - 1;
    }
  });

  incrementBtn?.addEventListener("click", () => {
    const currentValue = parseInt(quantityInput.value);
    const maxValue = parseInt(quantityInput.max || Infinity);
    if (currentValue < maxValue) {
      quantityInput.value = currentValue + 1;
    }
  });

  // Initial stock check
  checkStock();
});
