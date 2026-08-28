import { PhoneInput, defaultCountries } from 'react-international-phone';
import 'react-international-phone/style.css';
import type { CountryData } from 'react-international-phone';

type PhoneFieldProps = {
  id: string;
  value: string;
  onChange: (e164: string) => void;
  invalid?: boolean;
};

const PREFERRED = [
  'br',
  'pt',
  'us',
  'gb',
  'ca',
  'it',
  'es',
  'ar',
  'cl',
  'co',
  'mx',
  'py',
  'uy',
  'pe',
] as const;

const regionNames = new Intl.DisplayNames(['pt-BR'], { type: 'region' });

const countriesPt: CountryData[] = defaultCountries
  .map((country) => {
    const iso2 = String(country[1]);
    const namePt = regionNames.of(iso2.toUpperCase()) ?? country[0];
    return [namePt, ...country.slice(1)] as CountryData;
  })
  .sort((a, b) => String(a[0]).localeCompare(String(b[0]), 'pt-BR'));

export function PhoneField({ id, value, onChange, invalid }: PhoneFieldProps) {
  return (
    <PhoneInput
      defaultCountry="br"
      value={value}
      onChange={(phone) => onChange(phone)}
      countries={countriesPt}
      preferredCountries={[...PREFERRED]}
      forceDialCode
      placeholder="(11) 99999-8888"
      className={`phone-field${invalid ? ' has-error' : ''}`}
      inputProps={{
        id,
        name: 'phone',
        autoComplete: 'tel',
        inputMode: 'tel',
        'aria-invalid': invalid || undefined,
      }}
    />
  );
}
