import React, { useEffect } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { PageLayout } from 'src/ui/features/onboarding/shared/PageLayout';
import { WideScreen } from '../../shared/WideScreen';
import { ENABLE_DNA_BANNERS } from '../../components/DnaBanners';
import { Success } from './Success';
import { SelectBackground } from './SelectBackground';
import { SelectDna } from './SelectDna';
import { UpgradeDnaWaiting } from './UpgradeDnaWaiting';

export function UpgradeDnaFlow() {
  const navigate = useNavigate();
  useEffect(() => {
    if (!ENABLE_DNA_BANNERS) {
      navigate('/404');
    }
  }, [navigate]);
  if (!ENABLE_DNA_BANNERS) {
    return null;
  }
  return (
    <PageLayout>
      <WideScreen>
        <Routes>
          <Route path="/" element={<SelectBackground />} />
          <Route path="/sign" element={<SelectDna />} />
          <Route path="/waiting" element={<UpgradeDnaWaiting />} />
          <Route path="/success" element={<Success />} />
        </Routes>
      </WideScreen>
    </PageLayout>
  );
}
