document.querySelectorAll('[data-i18n]').forEach(addText)

function addText (el) {
  el.innerHTML = chrome.i18n.getMessage(el.dataset.i18n)
}
