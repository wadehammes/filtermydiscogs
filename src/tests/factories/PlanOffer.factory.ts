import { Factory } from "rosie";
import {
  PlanRateTypes,
  PlanCardApiTitle,
  PlanOffer,
} from "src/components/PlanCard/PlanCard.interfaces";

export const planOfferFactory = Factory.define<PlanOffer>("PlanOffer").attrs({
  efl_generated: true,
  end_date: "2021-07-31",
  gross_margin: null,
  id: 12008,
  price: "0.0980030",
  price_method: PlanRateTypes.Fixed,
  price_per_mwh: "59.5600000000",
  promo: null,
  rec_product: "AnyREC/100%",
  rhythm_kwh_rate: "0.0595600000",
  start_date: "2021-07-09",
  tags: {
    callout_en: null,
    callout_es: null,
    callout_color: null,
  },
  tdsp_kwh_rate: "0.0360480000",
  tdsp_monthly_charge: "4.7900000000",
  term_months: 36,
  title: PlanCardApiTitle.SimplyGreen36,
  base_charge_amount: "8.95000",
  is_green: true,
  plan_id: 157,
  campaign_id: 23,
  zuora_rate_plan_id: "2c92a0077579b3ec01758de448e65b2e",
  priority: 4,
  active: true,
  description_en: "Make a long-term impact with our best-priced plan.",
  description_es:
    "Consiga un impacto a largo plazo con nuestro plan al mejor precio.",
  long_description_es:
    "Obtenga nuestro plan 100% renovable al mejor precio y siéntase bien con lo que está pagando y el impacto que está teniendo a largo plazo. Además, sin cargos ocultos, atención al cliente los 7 días de la semana y puede ganar puntos de Rhythm\n Rewards que se pueden redimir para reducer su factura de energía!",
  long_description_en:
    "Get our best-priced, 100%-renewable plan and feel great about what you’re paying and the impact you’re making for the long-term. Plus, no hidden fees ever, 7-day-a-week customer support, and you can earn Rhythm Rewards Points that can be redeemed to reduce\n your energy bill!",
});
