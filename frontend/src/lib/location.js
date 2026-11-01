export function validPoint(value) {
  return !!value && value.lat !== '' && value.lng !== '' && value.lat != null && value.lng != null &&
    Number.isFinite(Number(value.lat)) && Number.isFinite(Number(value.lng)) &&
    Math.abs(Number(value.lat)) <= 90 && Math.abs(Number(value.lng)) <= 180;
}
