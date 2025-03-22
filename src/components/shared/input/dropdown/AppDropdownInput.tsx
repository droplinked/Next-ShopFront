'use client';

import dynamic from 'next/dynamic';
import { IAppDropDownInput } from './interface';
import { app_vertical } from '@/lib/variables/variables';
import { cn } from '@/lib/utils/cn/cn';
import AppTypography from '../../typography/AppTypography';
import { Avenir } from '@/styles/fonts';
const AppSelect = dynamic(() => import('react-select'), { ssr: false });

const AppDropDownInput = ({ options, select, value, label, placeholder = 'Select', disabled = false, typing, isLoading, name, id }: IAppDropDownInput) => (
  <div className={cn(app_vertical, 'w-full gap-2 items-start')}>
    {label && <AppTypography appClassName="font-normal text-sm">{label}</AppTypography>}
    <AppSelect
      name={name}
      id={id}
      className={cn(`block bg-transparent w-full placeholder:text-placeholder ${Avenir.className}`)}
      isDisabled={disabled}
      placeholder={placeholder}
      isLoading={isLoading}
      onInputChange={(event) => (typing ? typing(event) : {})}
      options={options}
      value={value}
      onChange={select}
      styles={{
        indicatorSeparator: (baseStyles: any) => ({ ...baseStyles, display: 'none' }),
        control: (baseStyles: any, state) => ({ ...baseStyles, border: `1px solid gray !important`, outline: 'none', boxShadow: 'none', fontSize: '14px' }),
        menu: (baseStyles: any) => ({ ...baseStyles, backgroundColor: 'white' }),
        singleValue: (baseStyles: any) => ({ ...baseStyles, color: 'black' }),
        option: (baseStyles: any) => ({
          ...baseStyles,
          background: 'none',
          cursor: 'pointer',
          color: 'black',
          fontSize: '14px',
          '&:hover': { backgroundColor: 'black', color: 'white' }
        })
      }}
    />
  </div>
);
export default AppDropDownInput;
