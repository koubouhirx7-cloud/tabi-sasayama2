const form = document.getElementById('contact-form');
const inputStep = document.getElementById('contact-input-step');
const confirmStep = document.getElementById('contact-confirm-step');
const confirmList = document.getElementById('contact-confirm-list');
const confirmButton = document.getElementById('contact-confirm-button');
const editButton = document.getElementById('contact-edit-button');

const fieldDefinitions = [
  ['お名前', 'name'],
  ['ふりがな', 'kana'],
  ['電話番号', 'tel'],
  ['メールアドレス', 'email'],
  ['お問い合わせ内容', 'message'],
  ['第一候補日', 'date_first'],
  ['第二候補日', 'date_second'],
  ['大人（12歳以上）', 'adult_count', '名'],
  ['小人（6〜12歳）', 'child_count', '名'],
  ['乳幼児（0〜6歳）', 'infant_count', '名'],
  ['ご予算', 'budget'],
  ['ご希望の体験内容', 'experience'],
];

const getFieldValue = (name, suffix = '') => {
  const field = form.elements.namedItem(name);
  if (!field || !field.value) return '未入力';
  return `${field.value}${suffix}`;
};

const renderConfirmation = () => {
  confirmList.replaceChildren();

  fieldDefinitions.forEach(([label, name, suffix = '']) => {
    const row = document.createElement('div');
    row.className = 'confirm-row';

    const term = document.createElement('dt');
    term.textContent = label;

    const detail = document.createElement('dd');
    detail.textContent = getFieldValue(name, suffix);

    row.append(term, detail);
    confirmList.append(row);
  });
};

const scrollToFormTop = () => {
  const top = form.getBoundingClientRect().top + window.scrollY - 118;
  window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
};

confirmButton?.addEventListener('click', () => {
  if (!form.reportValidity()) return;

  renderConfirmation();
  inputStep.hidden = true;
  confirmStep.hidden = false;
  scrollToFormTop();
});

editButton?.addEventListener('click', () => {
  confirmStep.hidden = true;
  inputStep.hidden = false;
  scrollToFormTop();
});

const params = new URLSearchParams(window.location.search);
const tour = params.get('tour');
const message = form?.elements.namedItem('message');

if (tour && message && !message.value) {
  message.value = `「${tour}」について相談したいです。`;
}
