import { useFormik } from 'formik';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { address_schema, initial_address } from '../../parts/schema/schema';
import useAppStore from '@/lib/stores/app/appStore';
import useAppCheckout from '@/functions/hooks/checkout/useAppCheckout';
import { app_center, app_vertical } from '@/lib/variables/variables';
import { cn } from '@/lib/utils/cn/cn';
import { getCitiesService, getCountriesService } from '@/lib/apis/checkout/service';
import useAppDebounce from '@/functions/hooks/debounce/useAppDebounce';
import AppIcons from '@/assets/AppIcons';
import { toast } from 'sonner';
import { AppButton, AppDropDownInput, AppInput, AppLinkButton } from '@/components/shared';
import { resolve } from 'path';

const CheckoutAddress = () => {
  const [locations, setLocations] = useState<{ countries: { name: string; id: number }[]; cities: { name: string; id: number; state_name: string }[]; search: string }>({
    countries: [],
    cities: [],
    search: ''
  });
  const _debounced_city = useAppDebounce(locations.search);
  const {states: {cart: { address, email, _id } }} = useAppStore();
  const { submit_address } = useAppCheckout();
  const { setValues, values, handleSubmit, isSubmitting, setSubmitting, isValid, dirty, handleChange } = useFormik({
    initialValues: initial_address({ address, email }),
    validationSchema: address_schema,
    enableReinitialize: true,
    validateOnChange: true,
    onSubmit: ({ email, ...address }) => {
      toast.promise(
        submit_address(address, email, _id).finally(() => setSubmitting(false)),
        { loading: 'Verifing email and address...', success: `Address verified.`, error: 'Address must be wrong' }
      );
    }
  });
  const _country_id = useMemo(() => locations?.countries?.find((el: any) => el.name === values.country)?.id || '', [values.country]);
  const _state_name = (city: string) => locations?.cities?.find((el: any) => el.name === city)?.state_name || '';
  const _get_countries = useCallback(() => getCountriesService({ name: '' }).then((res) => setLocations((prev) => ({ ...prev, countries: res.countries }))), [email]);
  const _select_country = (e: any) => setValues((prev) => ({ ...prev, country: e.value, state: null, city: null }));
  const _select_city = (e: any) => setValues((prev) => ({ ...prev, city: e.value, state: _state_name(e.value) }));

  useEffect(() => {
    !locations.countries.length && _get_countries();
  }, []);

  useEffect(() => {
    locations?.search &&
      locations?.search !== '' &&
      _country_id !== '' &&
      _country_id &&
      toast.promise(
        getCitiesService({ name: _debounced_city || '', country_id: _country_id }).then((res) => setLocations((prev) => ({ ...prev, cities: res.cities, loading: false }))),
        { loading: 'Trying to get cities...' }
      );
  }, [_debounced_city]);

  return (
    <form onSubmit={handleSubmit} className={cn(app_vertical, 'gap-6')}>
      <div className={cn(app_vertical, 'border rounded-sm p-6 gap-6 w-full')}>
        <AppInput name="email" label="Email Address" placeholder="Email Address" inputType="email" value={values.email} onChange={handleChange} />
        <div className={cn(app_center, 'w-full gap-6')}>
          <AppInput name="firstName" label="First name" placeholder="First name" value={values.firstName} onChange={handleChange} />
          <AppInput name="lastName" label="Last name" placeholder="Last name" value={values.lastName} onChange={handleChange} />
        </div>
        <AppInput name="addressLine1" label="Address Line 1" placeholder="Address Line 1" value={values.addressLine1} onChange={handleChange} />
        <AppInput name="addressLine2" label="Address Line 2" placeholder="Address Line 2" value={values.addressLine2} onChange={handleChange} />
        <div className={cn(app_center, 'w-full gap-6')}>
          <AppDropDownInput
            name="country"
            value={values.country ? { label: values.country, value: values.country } : null}
            typing={(e: string) => {}}
            isLoading={false}
            select={_select_country}
            options={locations?.countries?.map((el: any) => ({ value: el.name, label: el.name }))}
            label="Country"
          />
          <AppDropDownInput
            name="city"
            value={values.city ? { label: values.city, value: values.city } : null}
            typing={(e: string) => setLocations((prev) => ({ ...prev, search: e }))}
            isLoading={false}
            select={_select_city}
            label="City"
            options={(locations.cities.length && locations?.cities?.map((el: any) => ({ value: el.name, label: el.name + ` (${el.state_name})` }))) || []}
          />
          <AppDropDownInput name="state" value={values.state ? { label: values.state, value: values.state } : null} disabled={true} select={() => {}} options={[]} label="State" />
          <AppInput name="zip" label="Zip Code" placeholder="Zip Code" value={values.zip} onChange={handleChange} />
        </div>
      </div>
      <div className={cn(app_center, 'w-full justify-between')}>
        <AppLinkButton disabled={isSubmitting} href={'/'} appButtonProps={{ appVariant: 'filled', appClassName: cn(app_center, 'rounded-sm py-3 px-4 text-sm font-normal') }}>
          Back to shop
        </AppLinkButton>
        <AppButton disabled={!isValid || isSubmitting} loading={isSubmitting} appClassName={cn('py-3 pr-4 pl-4 rounded-sm', !isSubmitting && 'pl-9')} type="submit" hasIcon>
          Next
          <AppIcons.Arrow className={cn(!isValid || !dirty ? 'stroke-disabled-foreground' : 'stroke-foreground')} />
        </AppButton>
      </div>
    </form>
  );
};

export default CheckoutAddress;
