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

// Define proper types
type Country = { name: string; id: number };
type City = { name: string; id: number; state_name: string };
type LocationState = {
  allCountries: Country[];  // All countries from API
  allCities: City[];        // All cities from API for selected country
  filteredCountries: Country[]; // Filtered countries based on search
  filteredCities: City[];   // Filtered cities based on search
  countrySearch: string;
  citySearch: string;
  isLoadingCountries: boolean;
  isLoadingCities: boolean;
};
type SelectOption = { label: string; value: string };
type CountriesResponse = { countries: Country[] };
type CitiesResponse = { cities: City[] };

const CheckoutAddress: React.FC = () => {
  // Initialize state with proper typing
  const [locations, setLocations] = useState<LocationState>({
    allCountries: [],
    allCities: [],
    filteredCountries: [],
    filteredCities: [],
    countrySearch: '',
    citySearch: '',
    isLoadingCountries: false,
    isLoadingCities: false
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
  
  // Memoized helper functions for better performance
  const selectedCountryId = useMemo(
    () => locations.allCountries.find(country => country.name === values.country)?.name || '',
    [values.country, locations.allCountries]
  );
  
  // Helper functions
  const getStateNameByCity = useCallback(
    (cityName: string): string => 
      locations.allCities.find(city => city.name === cityName)?.state_name || '',
    [locations.allCities]
  );
  
  // Fetch all countries once
  const fetchAllCountries = useCallback(async () => {
    try {
      setLocations(prev => ({ ...prev, isLoadingCountries: true }));
      
      const response = await getCountriesService();
      const data = await response.json() as CountriesResponse;
      
      setLocations(prev => ({ 
        ...prev, 
        allCountries: data.countries,
        filteredCountries: data.countries,
        isLoadingCountries: false 
      }));
    } catch (error) {
      toast.error('Failed to load countries');
      setLocations(prev => ({ ...prev, isLoadingCountries: false }));
    }
  }, []);
  
  // Fetch all cities for a selected country
  const fetchAllCities = useCallback(async (countryId: string | number) => {
    if (!countryId) return;
    
    try {
      setLocations(prev => ({ ...prev, isLoadingCities: true }));
      
      const response = await getCitiesService({ country_id: countryId });
      const data = await response.json() as CitiesResponse;
      
      setLocations(prev => ({ 
        ...prev, 
        allCities: data.cities,
        filteredCities: data.cities,
        isLoadingCities: false 
      }));
    } catch (error) {
      toast.error('Failed to load cities');
      setLocations(prev => ({ ...prev, isLoadingCities: false }));
    }
  }, []);
  
  // Filter countries based on search input
  const filterCountries = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) {
      setLocations(prev => ({ 
        ...prev, 
        filteredCountries: prev.allCountries 
      }));
      return;
    }
    
    const lowerCaseSearch = searchTerm.toLowerCase();
    const filtered = locations.allCountries.filter(country => 
      country.name.toLowerCase().includes(lowerCaseSearch)
    );
    
    setLocations(prev => ({ 
      ...prev, 
      filteredCountries: filtered 
    }));
  }, [locations.allCountries]);
  
  // Filter cities based on search input
  const filterCities = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) {
      setLocations(prev => ({ 
        ...prev, 
        filteredCities: prev.allCities
      }));
      return;
    }
    
    const lowerCaseSearch = searchTerm.toLowerCase();
    const filtered = locations.allCities.filter(city => 
      city.name.toLowerCase().includes(lowerCaseSearch) || 
      city.state_name.toLowerCase().includes(lowerCaseSearch)
    );
    
    setLocations(prev => ({ 
      ...prev, 
      filteredCities: filtered 
    }));
  }, [locations.allCities]);
  
  const handleSelectCountry = useCallback((option: SelectOption) => {
    setValues(prev => ({ 
      ...prev, 
      country: option.value, 
      state: null, 
      city: null 
    }));
    
    // Reset city data when country changes
    setLocations(prev => ({ 
      ...prev, 
      allCities: [],
      filteredCities: [],
      citySearch: '' 
    }));
  }, [setValues]);
  
  const handleSelectCity = useCallback((option: SelectOption) => {
    const stateName = getStateNameByCity(option.value);
    setValues(prev => ({ 
      ...prev, 
      city: option.value, 
      state: stateName 
    }));
  }, [setValues, getStateNameByCity]);
  
  const handleCountrySearch = useCallback((searchText: string) => {
    setLocations(prev => ({ ...prev, countrySearch: searchText }));
  }, []);
  
  const handleCitySearch = useCallback((searchText: string) => {
    setLocations(prev => ({ ...prev, citySearch: searchText }));
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
  
  // Load cities when country is selected
  useEffect(() => {
    if (selectedCountryId && !locations.allCities.length) {
      fetchAllCities(selectedCountryId);
    }
  }, [selectedCountryId, locations.allCities.length, fetchAllCities]);
  
  // Filter cities when search term changes
  useEffect(() => {
    filterCities(debouncedCitySearch || '');
  }, [debouncedCitySearch, filterCities]);
  
  // Transform data for dropdown options
  const countryOptions = useMemo(() => 
    locations.filteredCountries.map(country => ({ 
      value: country.name, 
      label: country.name 
    })),
    [locations.filteredCountries]
  );
  
  const cityOptions = useMemo(() => 
    locations.filteredCities.length 
      ? locations.filteredCities.map(city => ({ 
          value: city.name, 
          label: `${city.name} (${city.state_name})` 
        }))
      : [],
    [locations.filteredCities]
  );

  return (
    <form onSubmit={handleSubmit} className={cn(app_vertical, 'gap-6')}>
      <div className={cn(app_vertical, 'border rounded-sm p-6 gap-6 w-full')}>
        <AppInput 
          name="email" 
          label="Email Address" 
          placeholder="Email Address" 
          inputType="email" 
          value={values.email} 
          onChange={handleChange} 
        />
        
        <div className={cn(app_center, 'w-full gap-6')}>
          <AppInput 
            name="firstName" 
            label="First name" 
            placeholder="First name" 
            value={values.firstName} 
            onChange={handleChange} 
          />
          <AppInput 
            name="lastName" 
            label="Last name" 
            placeholder="Last name" 
            value={values.lastName} 
            onChange={handleChange} 
          />
        </div>
        
        <AppInput 
          name="addressLine1" 
          label="Address Line 1" 
          placeholder="Address Line 1" 
          value={values.addressLine1} 
          onChange={handleChange} 
        />
        <AppInput 
          name="addressLine2" 
          label="Address Line 2" 
          placeholder="Address Line 2" 
          value={values.addressLine2} 
          onChange={handleChange} 
        />
        
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
          
          <AppDropDownInput 
            name="state" 
            value={values.state ? { label: values.state, value: values.state } : null} 
            disabled={true} 
            select={() => {}} 
            options={[]} 
            label="State" 
          />
          
          <AppInput 
            name="zip" 
            label="Zip Code" 
            placeholder="Zip Code" 
            value={values.zip} 
            onChange={handleChange} 
          />
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
        
        <AppButton 
          disabled={!isValid || isSubmitting} 
          loading={isSubmitting} 
          appClassName={cn('py-3 pr-4 pl-4 rounded-sm', !isSubmitting && 'pl-9')} 
          type="submit" 
          hasIcon
        >
          Next
          <AppIcons.Arrow className={cn(!isValid || !dirty ? 'stroke-disabled-foreground' : 'stroke-foreground')} />
        </AppButton>
      </div>
    </form>
  );
};

export default CheckoutAddress;
