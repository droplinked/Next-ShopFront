import { get_shop_service } from '@/lib/apis/shop/service';

function useAppShop() {
  const fetchShopData = async () => {
    try {
      const shopData = await get_shop_service();
      return shopData;
    } catch (error) {
      console.error('Failed to fetch shop data:', error);
      throw error; 
    }
  };

  return { fetchShopData };
}

export default useAppShop;