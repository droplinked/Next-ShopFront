import { AppDropDown, AppInput } from "@/components/shared/input/AppInput";
import { Form, Formik, useFormik } from "formik";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { addressSchema, initialAddress } from "../schema/schema";
import useAppStore from "@/lib/stores/app/appStore";
import useAppCheckout from "@/functions/hooks/checkout/useAppCheckout";
import { app_center, app_vertical } from "@/lib/variables/variables";
import { cn } from "@/lib/utils/cn/cn";
import AppTypography from "@/components/shared/typography/AppTypography";
import { get_cities_service, get_countries_service } from "@/lib/apis/checkout/service";
import useAppDebounce from "@/functions/hooks/debounce/useAppDebounce";
import AppButton from "@/components/shared/button/AppButton";
import Link from "next/link";
import AppIcons from "@/assets/AppIcons";
import { toast } from "sonner";
import AppLinkButton from "@/components/shared/button/link/AppLinkButton";

const CheckoutAddress = () => {
    const [locations, setLocations] = useState<{ countries: { name: string; id: number }[]; cities: { name: string; id: number, state_name: string }[] , search: string, loading: boolean}>({ countries: [], cities: [], search: "", loading: false });
    const _debounced_city = useAppDebounce(locations.search);
    const { states: { cart: { address, email, _id } } } = useAppStore();
    const { submit_address } = useAppCheckout();
    const { setFieldValue, setValues, values, errors, handleSubmit, isValid, dirty, handleChange } = useFormik({ initialValues: initialAddress({ address, email }), validationSchema: addressSchema, enableReinitialize: true, validateOnChange: true, onSubmit: async ({email, ...address}) =>{ setLocations((prev)=> ({...prev, loading: true})); return toast.promise(async () => await submit_address(address, email, _id), {loading: 'Verifing email and address...', success:() => {setLocations((prev)=> ({...prev, loading: false})); return `Address verified.`}, error: 'Address must be wrong' })}});
    const _country_id = useMemo(() => locations?.countries?.find((el: any) => el.name === values.country)?.id || "" ,[values.country]);
    const _state_name = (city: string) => locations?.cities?.find((el: any) => el.name === city)?.state_name || "";
    const _get_countries = useCallback(() => get_countries_service({ name: "" }).then((res) => setLocations((prev) => ({ ...prev, countries: res.countries }))), [email]);
    const _select_country = (e: any) => setValues((prev) => ({ ...prev, country: e.value, state: null, city: null }));
    const _select_city = (e: any) => setValues((prev) => ({ ...prev, city: e.value, state: _state_name(e.value) }));
    useEffect(() => { !locations.countries.length && _get_countries() }, []);
    useEffect(() => { locations?.search && locations?.search !== "" && _country_id !== "" && _country_id &&  toast.promise(get_cities_service({name: _debounced_city || "", country_id: _country_id}).then(res => setLocations((prev)=> ({ ...prev, cities: res.cities, loading: false }))), {loading: "Trying to get cities..."}) }, [_debounced_city]);
    return (
        <form onSubmit={(e) => {e.preventDefault(); return handleSubmit()}} className={cn(app_vertical, 'gap-6')}>
            <div className={cn(app_vertical, "border rounded-sm p-6 gap-6 w-full")}>
                <AppInput name="email" label="Email Address" placeholder="Email Address" inputType="email" value={values.email} onChange={handleChange}/>
                <div className={cn(app_center, "w-full gap-6")}>
                    <AppInput name="firstName" label="First name" placeholder="First name" value={values.firstName} onChange={handleChange} />
                    <AppInput name="lastName" label="Last name" placeholder="Last name" value={values.lastName} onChange={handleChange}/>
                </div>
                <AppInput name="addressLine1" label="Address Line 1" placeholder="Address Line 1" value={values.addressLine1} onChange={handleChange} />
                <AppInput name="addressLine2" label="Address Line 2" placeholder="Address Line 2" value={values.addressLine2} onChange={handleChange}/>
                <div className={cn(app_center, "w-full gap-6")}>
                    <AppDropDown name="country"  value={values.country ? { label: values.country, value: values.country } : null} typing={(e: string) => {}} isLoading={false} select={_select_country} options={locations?.countries?.map((el: any) => ({ value: el.name, label: el.name }))} label="Country"/>
                    <AppDropDown name="city" value={values.city ? { label: values.city, value: values.city } : null} typing={(e: string) => setLocations((prev)=> ({ ...prev, search: e }))} isLoading={false} select={_select_city} label="City" options={locations.cities.length && locations?.cities?.map((el: any) => ({ value: el.name, label: el.name + ` (${el.state_name})` })) || []}/>
                    <AppDropDown name="state" value={values.state ? { label: values.state, value: values.state } : null} disabled={true} select={() => { }} options={[]} label="State"/>
                    <AppInput name="zip" label="Zip Code" placeholder="Zip Code" value={values.zip} onChange={handleChange} />
                </div>
            </div>
            <div className={cn(app_center, 'w-full justify-between')}>
                <AppLinkButton  disabled={locations.loading} href={'/'} appButtonProps={{appVariant: "filled", appClassName: cn(app_center, 'rounded-sm py-3 px-4 text-sm font-normal')}}>Back to shop</AppLinkButton>
                <AppButton disabled={!isValid || dirty || locations.loading} loading={locations.loading} appClassName="py-3 pr-4 pl-9 rounded-sm" type="submit" hasIcon>Next<AppIcons.Arrow className={cn((!isValid || !dirty) ? "stroke-disabled-foreground" : "stroke-foreground")}/></AppButton>
            </div>
        </form>
    );
};

export default CheckoutAddress;
