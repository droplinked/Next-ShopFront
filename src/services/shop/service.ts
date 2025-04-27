export const get_shop_service = async () => {
  const response = await fetch(`api/shop`, { cache: "no-cache" });
  return await response.json();
}
