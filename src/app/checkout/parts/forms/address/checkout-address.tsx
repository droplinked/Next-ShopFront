import useAppStore from '@/lib/stores/app/appStore';
import { cn } from '@/lib/utils/cn/cn';
import { app_center, app_vertical } from '@/lib/variables/variables';
import useAppCheckout from '@/state/hooks/checkout/useAppCheckout';
import { useFormik } from 'formik';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { address_schema, initial_address } from '../../parts/schema/schema';
import AppIcons from '@/assets/AppIcons';
import { AppButton, AppDropDownInput, AppInput, AppLinkButton } from '@/components/ui';
import { getCitiesService, getCountriesService } from '@/services/checkout/service';
import useAppDebounce from '@/state/hooks/debounce/useAppDebounce';
import { toast } from 'sonner';

// Define proper types
type Country = { name: string; id: number };
type City = { name: string; id: number; state_name: string };
type LocationState = {
  allCountries: Country[]; // All countries from API
  filteredCountries: Country[]; // Filtered countries based on search
  cities: City[]; // Cities list from API (filtered by name if provided)
  countrySearch: string;
  citySearch: string;
  isLoadingCountries: boolean;
  isLoadingCities: boolean;
  selectedCountry: string | null;
};
type SelectOption = { label: string; value: string };
type CountriesResponse = { countries: Country[] };
type CitiesResponse = { cities: City[] };

const CheckoutAddress: React.FC = () => {
  // Initialize state with proper typing
  const [locations, setLocations] = useState<LocationState>({
    allCountries: [],
    filteredCountries: [],
    cities: [],
    countrySearch: '',
    citySearch: '',
    isLoadingCountries: false,
    isLoadingCities: false,
    selectedCountry: null
  });

  const debouncedCitySearch = useAppDebounce(locations.citySearch);
  const debouncedCountrySearch = useAppDebounce(locations.countrySearch);

  const {
    states: {
      cart: { address, email, _id }
    }
  } = useAppStore();

  const { submit_address } = useAppCheckout();

  // Initialize form with Formik
  const formik = useFormik({
    initialValues: initial_address({ address, email }),
    validationSchema: address_schema,
    enableReinitialize: true,
    validateOnChange: true,
    onSubmit: ({ email, ...address }) => {
      toast.promise(
        submit_address(address, email, _id).finally(() => formik.setSubmitting(false)),
        {
          loading: 'Verifying email and address...',
          success: 'Address verified.',
          error: 'There was an issue with your address information'
        }
      );
    }
  });

  const { setValues, values, handleSubmit, isSubmitting, isValid, dirty, handleChange } = formik;

  // Helper functions
  const getStateNameByCity = useCallback((cityName: string): string => locations.cities.find((city) => city.name === cityName)?.state_name || '', [locations.cities]);

  // Fetch all countries once
  const fetchAllCountries = useCallback(async () => {
    try {
      setLocations((prev) => ({ ...prev, isLoadingCountries: true }));

      const response = await getCountriesService();
      const data = (await response.json()) as CountriesResponse;

      setLocations((prev) => ({
        ...prev,
        allCountries: data.countries,
        filteredCountries: data.countries,
        isLoadingCountries: false
      }));
    } catch (error) {
      toast.error('Failed to load countries');
      setLocations((prev) => ({ ...prev, isLoadingCountries: false }));
    }
  }, []);

  // Fetch cities for a selected country with optional name filter
  const fetchCities = useCallback(async (countryName: string, searchTerm: string = '') => {
    if (!countryName) return;

    try {
      setLocations((prev) => ({ ...prev, isLoadingCities: true }));

      const response = await getCitiesService({
        name: searchTerm,
        country_name: countryName
      });
      const data = (await response.json()) as CitiesResponse;

      setLocations((prev) => ({
        ...prev,
        cities: data.cities,
        isLoadingCities: false
      }));
    } catch (error) {
      toast.error('Failed to load cities');
      setLocations((prev) => ({ ...prev, isLoadingCities: false }));
    }
  }, []);

  // Filter countries based on search input
  const filterCountries = useCallback(
    (searchTerm: string) => {
      if (!searchTerm.trim()) {
        setLocations((prev) => ({
          ...prev,
          filteredCountries: prev.allCountries
        }));
        return;
      }

      const lowerCaseSearch = searchTerm.toLowerCase();
      const filtered = locations.allCountries.filter((country) => country.name.toLowerCase().includes(lowerCaseSearch));

      setLocations((prev) => ({
        ...prev,
        filteredCountries: filtered
      }));
    },
    [locations.allCountries]
  );

  const handleSelectCountry = useCallback(
    (option: SelectOption) => {
      const selectedCountryName = option.value;

      setValues((prev) => ({
        ...prev,
        country: selectedCountryName,
        state: null,
        city: null
      }));

      // Reset city data and set selected country when country changes
      setLocations((prev) => ({
        ...prev,
        cities: [],
        citySearch: '',
        selectedCountry: selectedCountryName
      }));

      // Fetch cities for the selected country
      fetchCities(selectedCountryName, '');
    },
    [setValues, fetchCities]
  );

  const handleSelectCity = useCallback(
    (option: SelectOption) => {
      const stateName = getStateNameByCity(option.value);
      setValues((prev) => ({
        ...prev,
        city: option.value,
        state: stateName
      }));
    },
    [setValues, getStateNameByCity]
  );

  const handleCountrySearch = useCallback((searchText: string) => {
    setLocations((prev) => ({ ...prev, countrySearch: searchText }));
  }, []);

  const handleCitySearch = useCallback((searchText: string) => {
    setLocations((prev) => ({ ...prev, citySearch: searchText }));
  }, []);

  // Load countries on component mount
  useEffect(() => {
    if (!locations.allCountries.length) {
      fetchAllCountries();
    }
  }, [fetchAllCountries, locations.allCountries.length]);

  // Filter countries when search term changes
  useEffect(() => {
    filterCountries(debouncedCountrySearch || '');
  }, [debouncedCountrySearch, filterCountries]);

  // Refresh cities when country is selected or city search term changes
  useEffect(() => {
    if (locations.selectedCountry) {
      fetchCities(locations.selectedCountry, debouncedCitySearch || '');
    }
  }, [locations.selectedCountry, debouncedCitySearch, fetchCities]);

  // Transform data for dropdown options
  const countryOptions = useMemo(
    () =>
      locations.filteredCountries.map((country) => ({
        value: country.name,
        label: country.name
      })),
    [locations.filteredCountries]
  );

  const cityOptions = useMemo(
    () =>
      locations.cities.length
        ? locations.cities.map((city) => ({
            value: city.name,
            label: `${city.name} (${city.state_name})`
          }))
        : [],
    [locations.cities]
  );

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
            typing={handleCountrySearch}
            isLoading={locations.isLoadingCountries}
            select={handleSelectCountry}
            options={countryOptions}
            label="Country"
          />

          <AppDropDownInput
            name="city"
            value={values.city ? { label: values.city, value: values.city } : null}
            typing={handleCitySearch}
            isLoading={locations.isLoadingCities}
            select={handleSelectCity}
            label="City"
            options={cityOptions}
          />

          <AppDropDownInput name="state" value={values.state ? { label: values.state, value: values.state } : null} disabled={true} select={() => {}} options={[]} label="State" />

          <AppInput name="zip" label="Zip Code" placeholder="Zip Code" value={values.zip} onChange={handleChange} />
        </div>
      </div>

      <div className={cn(app_center, 'w-full justify-between')}>
        <AppLinkButton
          disabled={isSubmitting}
          href={'/'}
          appButtonProps={{
            appVariant: 'filled',
            appClassName: cn(app_center, 'rounded-sm py-3 px-4 text-sm font-normal')
          }}
        >
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
