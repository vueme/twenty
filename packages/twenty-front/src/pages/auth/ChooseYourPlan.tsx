import { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { useRecoilState, useRecoilValue } from 'recoil';
import Stripe from 'stripe';

import { SubTitle } from '@/auth/components/SubTitle.tsx';
import { Title } from '@/auth/components/Title.tsx';
import { tokenPairState } from '@/auth/states/tokenPairState.ts';
import { billingState } from '@/client-config/states/billingState.ts';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar.tsx';
import { LargeMainButton } from '@/ui/input/button/components/LargeMainButton.tsx';
import { CardPicker } from '@/ui/input/components/CardPicker.tsx';
import { SubscriptionBenefit } from '@/ui/input/subscription/components/SubscriptionBenefit.tsx';
import { SubscriptionCard } from '@/ui/input/subscription/components/SubscriptionCard.tsx';
import { REACT_APP_SERVER_BASE_URL } from '~/config';

const StyledChoosePlanContainer = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  margin: ${({ theme }) => theme.spacing(8)} 0
    ${({ theme }) => theme.spacing(1)};
  gap: ${({ theme }) => theme.spacing(2)};
`;

const StyledBenefitsContainer = styled.div`
  background-color: ${({ theme }) => theme.background.secondary};
  border: 1px solid ${({ theme }) => theme.border.color.medium};
  border-radius: ${({ theme }) => theme.border.radius.md};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 16px;
  padding: ${({ theme }) => theme.spacing(4)} ${({ theme }) => theme.spacing(3)};
`;

export const ChooseYourPlan = () => {
  const billing = useRecoilValue(billingState);

  const [planSelected, setPlanSelected] =
    useState<Stripe.Price.Recurring.Interval>('month');

  const [prices, setPrices] = useState<Stripe.Price[]>();

  const [tokenPair] = useRecoilState(tokenPairState);

  const { enqueueSnackBar } = useSnackBar();

  const handlePlanChange = (type?: Stripe.Price.Recurring.Interval) => {
    return () => {
      if (type && planSelected !== type) {
        setPlanSelected(type);
      }
    };
  };

  const sortPrices = (prices: Stripe.Price[]) => {
    return prices.sort((a: Stripe.Price, b: Stripe.Price) => {
      return (a.unit_amount || 0) - (b.unit_amount || 0);
    });
  };

  const computeInfo = (price: Stripe.Price, prices: Stripe.Price[]): string => {
    if (price.recurring?.interval !== 'year') {
      return 'Cancel anytime';
    }
    const monthPrice = prices.filter(
      (price) => price.recurring?.interval === 'month',
    )?.[0];
    if (monthPrice && monthPrice.unit_amount && price.unit_amount) {
      return `Save $${(12 * monthPrice.unit_amount - price.unit_amount) / 100}`;
    }
    return 'Cancel anytime';
  };

  const handleButtonClick = () => {
    fetch(REACT_APP_SERVER_BASE_URL + '/billing/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${tokenPair?.accessToken.token}`,
      },
      body: JSON.stringify({ recurringInterval: planSelected }),
    })
      .then((response) => response.json())
      .then((data) => {
        const redirectUrl = data?.url;
        if (redirectUrl) {
          window.location.replace(redirectUrl);
        }
      });
  };

  useEffect(() => {
    fetch(REACT_APP_SERVER_BASE_URL + '/billing/product-prices/base-plan')
      .then((response) => response.json())
      .then((data) => setPrices(sortPrices(data)))
      .catch(() => {
        enqueueSnackBar('Error while fetching prices. Please retry', {
          variant: 'error',
        });
      });
  }, [setPrices, enqueueSnackBar]);

  return (
    prices && (
      <>
        <Title>Choose your Plan</Title>
        <SubTitle>
          Not satisfied in {billing?.billingFreeTrialDurationInDays} days? Full
          refund.
        </SubTitle>
        <StyledChoosePlanContainer>
          {prices.map((price, index) => (
            <CardPicker
              checked={price.recurring?.interval === planSelected}
              handleChange={handlePlanChange(price.recurring?.interval)}
              key={index}
            >
              <SubscriptionCard
                type={price.recurring?.interval}
                price={(price.unit_amount || 0) / 100}
                info={computeInfo(price, prices)}
              />
            </CardPicker>
          ))}
        </StyledChoosePlanContainer>
        <StyledBenefitsContainer>
          <SubscriptionBenefit>Full access</SubscriptionBenefit>
          <SubscriptionBenefit>White gloves onboarding</SubscriptionBenefit>
          <SubscriptionBenefit>Unlimited contacts</SubscriptionBenefit>
          <SubscriptionBenefit>Priority support</SubscriptionBenefit>
          <SubscriptionBenefit>Frequent updates</SubscriptionBenefit>
          <SubscriptionBenefit>
            {billing?.billingFreeTrialDurationInDays}-day refund
          </SubscriptionBenefit>
        </StyledBenefitsContainer>
        <LargeMainButton title="Continue" onClick={handleButtonClick} />
      </>
    )
  );
};