import { useMemo } from 'react';
import {
  sphereMaterial,
  atmosMaterial,
  atmosMaterial2,
  moonMaterial,
} from '../SphereData';

export const useSphereMaterials = () => {
  return useMemo(() => {
    return {
      red: sphereMaterial.clone(),
      green: atmosMaterial.clone(),
      blue: atmosMaterial2.clone(),
      purple: sphereMaterial.clone(),
      brown: sphereMaterial.clone(),
      greenMoon: moonMaterial.clone(),
      purpleMoon: moonMaterial.clone(),
    };
  }, []);
};
