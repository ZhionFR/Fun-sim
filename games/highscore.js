const PFX = 'mg_hs_';

export function getHS(id) {
  const v = parseInt(localStorage.getItem(PFX + id), 10);
  return isNaN(v) ? 0 : v;
}

export function trySetHS(id, value) {
  if (value > getHS(id)) {
    localStorage.setItem(PFX + id, String(value));
    return true;
  }
  return false;
}
