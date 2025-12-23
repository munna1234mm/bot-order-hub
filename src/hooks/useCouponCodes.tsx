import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CouponCode {
  id: string;
  code: string;
  credits: number;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
}

export const useCouponCodes = () => {
  const [coupons, setCoupons] = useState<CouponCode[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCoupons = async () => {
    const { data, error } = await supabase
      .from('coupon_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching coupons:', error);
    } else {
      setCoupons(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCoupons();

    const channel = supabase
      .channel('coupon_codes_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'coupon_codes' },
        () => {
          fetchCoupons();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addCoupon = async (code: string, credits: number = 3, maxUses: number | null = null): Promise<boolean> => {
    const { error } = await supabase
      .from('coupon_codes')
      .insert({ code: code.toUpperCase(), credits, max_uses: maxUses });

    if (error) {
      console.error('Error adding coupon:', error);
      return false;
    }
    return true;
  };

  const updateCoupon = async (id: string, updates: Partial<CouponCode>): Promise<boolean> => {
    const { error } = await supabase
      .from('coupon_codes')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating coupon:', error);
      return false;
    }
    return true;
  };

  const deleteCoupon = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('coupon_codes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting coupon:', error);
      return false;
    }
    return true;
  };

  return { coupons, loading, addCoupon, updateCoupon, deleteCoupon };
};
