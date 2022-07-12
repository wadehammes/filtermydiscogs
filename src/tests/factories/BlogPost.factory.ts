import { BLOCKS, INLINES } from "@contentful/rich-text-types";
import { Factory } from "rosie";
import { BlogPostType } from "src/components/Blog/Blog.interfaces";
import { PageFontWeight } from "src/components/Page/Page.interfaces";
import { mediaTypeFactory } from "src/tests/factories/MediaType.factory";

export const blogPostFactory = Factory.define<BlogPostType>(
  "BlogPostType"
).attrs({
  id: "7GOpuzLNqiTiScFd6bwmez",
  blogPostData: {
    createdAt: "2021-10-26T18:43:07.456Z",
    updatedAt: "2021-10-26T18:43:07.456Z",
    revision: 1,
  },
  blogPostTitle: {
    en: "The New Ford F-150 Lightning: The Future of Trucks",
    es: "La nueva Ford F-150 Lightning: el futuro de los camiones",
  },
  primaryCategory: {
    id: "JYZFrTWJtrn4EUSQRjMQx",
    modified: "2021-10-26T18:23:37.045Z",
    categoryName: {
      en: "Electric Vehicles",
      es: "Vehículos Eléctricos",
    },
    slug: "electric-vehicles",
    metadata: null,
  },
  slug: "the-new-ford-f-150-lightning-the-future-of-trucks",
  blogPostImage: mediaTypeFactory.build(),
  blogPost: {
    en: {
      data: {},
      content: [
        {
          data: {},
          content: [
            {
              data: {},
              marks: [],
              value:
                "For the last four-plus decades, the Ford F-series has been the best-selling truck nationwide. Being headquartered in ",
              nodeType: "text",
            },
            {
              data: {
                uri: "https://www.gotrhythm.com/electricity/texas",
              },
              content: [
                {
                  data: {},
                  marks: [],
                  value: "Texas",
                  nodeType: "text",
                },
              ],
              nodeType: INLINES.HYPERLINK,
            },
            {
              data: {},
              marks: [],
              value: ", we at Rhythm can confirm that.  ",
              nodeType: "text",
            },
          ],
          nodeType: BLOCKS.PARAGRAPH,
        },
        {
          data: {},
          content: [
            {
              data: {},
              marks: [],
              value:
                "It’s a truck that represents hard work, the outdoors, and doing hard work in the outdoors. So, when the Ford introduced the new, 100% electric model of the renowned F-150, we knew it would turn some heads and raise some eyebrows.  ",
              nodeType: "text",
            },
          ],
          nodeType: BLOCKS.PARAGRAPH,
        },
        {
          data: {},
          content: [
            {
              data: {},
              marks: [],
              value:
                "It’s a step that’s in line with our belief at Rhythm: That ",
              nodeType: "text",
            },
            {
              data: {
                uri: "https://www.gotrhythm.com/about/renewable-energy",
              },
              content: [
                {
                  data: {},
                  marks: [],
                  value: "renewable energy",
                  nodeType: "text",
                },
              ],
              nodeType: INLINES.HYPERLINK,
            },
            {
              data: {},
              marks: [],
              value:
                " is truly for everyone. It doesn’t have to be a politically motivated, hot-button-issue decision. It can just be a simple choice of owning a versatile, tough, classic, and now eco-friendly, truck.  ",
              nodeType: "text",
            },
          ],
          nodeType: BLOCKS.PARAGRAPH,
        },
        {
          data: {},
          content: [
            {
              data: {},
              marks: [
                {
                  type: "bold",
                },
              ],
              value: "The people have responded—profoundly.  ",
              nodeType: "text",
            },
          ],
          nodeType: BLOCKS.PARAGRAPH,
        },
        {
          data: {},
          content: [
            {
              data: {},
              marks: [],
              value:
                "When Ford revealed the F-150 Lightning in May of 2021, initial demand absolutely skyrocketed. So high, that Reuters has reported that Ford is preparing to double F-150 Lightning production for 2024. This is the second time since its announcement that Ford has had to significantly increase production plans, which began with the influx of $100 pre-orders in May. Ford already has 120,000 pre-orders for the Lightning, which launches in the spring of 2022. Initially, they were planning on a 15,000-unit run to fulfill consumers’ desires. Now, they’ve committed $850 million to reach the new goal of fulfilling the demand.  ",
              nodeType: "text",
            },
          ],
          nodeType: BLOCKS.PARAGRAPH,
        },
        {
          data: {},
          content: [
            {
              data: {},
              marks: [],
              value:
                "And it makes sense — especially when you look under the hood. Ford is proving that you don’t have to take a step back to switch to an electric vehicle. The powerful, sleek, environmentally friendly truck is actually a momentous leap forward.   ",
              nodeType: "text",
            },
          ],
          nodeType: BLOCKS.PARAGRAPH,
        },
        {
          data: {},
          content: [
            {
              data: {},
              marks: [
                {
                  type: "bold",
                },
              ],
              value: "Electric also means powerful.  ",
              nodeType: "text",
            },
          ],
          nodeType: BLOCKS.PARAGRAPH,
        },
        {
          data: {},
          content: [
            {
              data: {},
              marks: [],
              value:
                "The Ford F-150 Lightning is the smartest, most technologically advanced truck Ford has ever engineered. Not only does it boast a targeted 563 horsepower, but its 775-lb. ft. of torque is the most of any F-150 ever. So, we’re sorry to the electric-vehicles-are-weak crowd. That’s simply not the case. This makes it one of the quickest trucks Ford has ever released. And it comes with great range—up to 300 miles on a full charge (or 400 miles if you’re payload-free).  ",
              nodeType: "text",
            },
          ],
          nodeType: BLOCKS.PARAGRAPH,
        },
        {
          data: {},
          content: [
            {
              data: {},
              marks: [],
              value:
                "It’s quick off the jump, virtually silent, and unbelievably smooth. Rev up to 60 mph in about five seconds. The traditional, gas-powered model can carry up to 2,000 pounds of payload, while the XLT and Lariat models with 18-inch wheels can haul up to 10,000. And the low center of gravity gives you peace of mind for the long-haul if you’re driving in less-than-ideal conditions.  ",
              nodeType: "text",
            },
          ],
          nodeType: BLOCKS.PARAGRAPH,
        },
        {
          data: {},
          content: [
            {
              data: {},
              marks: [
                {
                  type: "bold",
                },
              ],
              value: "Power your home with your truck. Really. ",
              nodeType: "text",
            },
          ],
          nodeType: BLOCKS.PARAGRAPH,
        },
        {
          data: {},
          content: [
            {
              data: {},
              marks: [],
              value:
                "Everything’s connected. Everything’s electrified. Everything’s, therefore, simpler. The battery packs—located out of sight inside the floor of the truck—power the whole thing. And with that, you have backup power to your home. Seriously. While you’d hope you’d never have to, you could easily power your home… from your truck. It can offload up to 10 kilowatts of power, so the Ford Intelligent Backup Power can supply you power during an outage. This means the lights stay on, the appliances stay running, and you’re safe.  ",
              nodeType: "text",
            },
          ],
          nodeType: BLOCKS.PARAGRAPH,
        },
        {
          data: {},
          content: [
            {
              data: {},
              marks: [],
              value:
                "It’s all thanks to the 80-amp Ford Charge Station Pro and home management system, which causes the Ford F-150 Lightning to automatically kick into backup-power mode when there’s a disruption. When the power comes back, your truck  automatically switches back to battery-charging mode, hands-free.  ",
              nodeType: "text",
            },
          ],
          nodeType: BLOCKS.PARAGRAPH,
        },
        {
          data: {},
          content: [
            {
              data: {},
              marks: [],
              value:
                "If you and your family use about 30kWh of power per day (which is relatively standard), you’ll have power from your Ford F-150 for up to three days. If you ration your power consumption, it could last up to 10 days. Down the road, Ford has already announced plans to introduce Ford Intelligent Power, which can switch your home consumption to your truck during peak times (and usually higher prices). It can save you money and take some of the demand off the grid.  ",
              nodeType: "text",
            },
          ],
          nodeType: BLOCKS.PARAGRAPH,
        },
        {
          data: {},
          content: [
            {
              data: {},
              marks: [
                {
                  type: "bold",
                },
              ],
              value: "Power away from home, too. ",
              nodeType: "text",
            },
          ],
          nodeType: BLOCKS.PARAGRAPH,
        },
        {
          data: {},
          content: [
            {
              data: {},
              marks: [],
              value:
                "With its advanced, interconnected systems, drivers and passengers can take quick advantage of built-in electrical outlets to directly power… anything. From tools on a camping trip to a cellphone on a road trip, up to 9.6 kilowatts (on luxury models) is available. Smart features in the Ford F-150 make power management easy, too. You’ll get a FordPass notification any time your battery falls below one-third of its range, and you can turn off certain features with a simple click to preserve the juice until you get to your charging station.  ",
              nodeType: "text",
            },
          ],
          nodeType: BLOCKS.PARAGRAPH,
        },
        {
          data: {},
          content: [
            {
              data: {},
              marks: [],
              value:
                "These simple—yet unbelievably appreciated—capabilities are all thanks to the truck’s powerful, future-minded lithium-ion battery, which come in standard form of up to 230 miles of range, and an extended version, which provides up to 300 miles.  ",
              nodeType: "text",
            },
          ],
          nodeType: BLOCKS.PARAGRAPH,
        },
        {
          data: {},
          content: [
            {
              data: {},
              marks: [
                {
                  type: "bold",
                },
              ],
              value: "And, yes, it’ll turn heads.  ",
              nodeType: "text",
            },
          ],
          nodeType: BLOCKS.PARAGRAPH,
        },
        {
          data: {},
          content: [
            {
              data: {},
              marks: [],
              value:
                "Yes, Ford lovers, at first glance, you’re going to know it’s an F-Series truck. It’s a perfect blend of rugged and modernity. From the exterior LED lightbars to the three, distinctive grill designs, it’s a bold look that pays homage to the past while keeping an eye on the future.  ",
              nodeType: "text",
            },
          ],
          nodeType: BLOCKS.PARAGRAPH,
        },
        {
          data: {},
          content: [
            {
              data: {},
              marks: [],
              value:
                "Ford also claims it’s the most aerodynamic F-150 they’ve ever made, which helps the mileage (fuel economy), which helps the battery life, which helps you. Strategically shaped running boards, a drag-reducing hood, and a textured grill all help air breeze past to keep your ride smooth and productive.  ",
              nodeType: "text",
            },
          ],
          nodeType: BLOCKS.PARAGRAPH,
        },
        {
          data: {},
          content: [
            {
              data: {},
              marks: [],
              value:
                "And it doesn’t compromise a thing—not even space. The seating is 100% identical to a gas-powered Ford F-150, with fold-out work-surface capabilities and 180-degree reclining capabilities, so you can recharge while your truck recharges.  ",
              nodeType: "text",
            },
          ],
          nodeType: BLOCKS.PARAGRAPH,
        },
        {
          data: {},
          content: [
            {
              data: {},
              marks: [
                {
                  type: "bold",
                },
              ],
              value: "So... why is an energy company talking about a truck? ",
              nodeType: "text",
            },
          ],
          nodeType: BLOCKS.PARAGRAPH,
        },
        {
          data: {},
          content: [
            {
              data: {},
              marks: [],
              value:
                "For starters, we think it’s a beast of a vehicle in all the best ways. While we don’t envision making Rhythm Trucks anytime soon, we love all the Ford F-150 Lightning stands for. It proves that renewable, forward-thinking products can be for everyone, everywhere, anytime. We are obviously huge fans of the environment, as you can see with our 100% ",
              nodeType: "text",
            },
            {
              data: {
                uri: "http://gotrhythm.com/",
              },
              content: [
                {
                  data: {},
                  marks: [],
                  value: "renewable energy plans",
                  nodeType: "text",
                },
              ],
              nodeType: INLINES.HYPERLINK,
            },
            {
              data: {},
              marks: [],
              value:
                ". So anytime a company makes a bold move like Ford is here, we applaud it.  ",
              nodeType: "text",
            },
          ],
          nodeType: BLOCKS.PARAGRAPH,
        },
        {
          data: {},
          content: [
            {
              data: {},
              marks: [],
              value:
                "We’re hopeful that Ford has paved the way for other like companies to join the movement toward an electrified, connected, greener future. At Rhythm, we’re onboard.",
              nodeType: "text",
            },
          ],
          nodeType: BLOCKS.PARAGRAPH,
        },
      ],
      nodeType: BLOCKS.DOCUMENT,
    },
    es: {
      data: {},
      content: [
        {
          data: {},
          content: [
            {
              data: {},
              marks: [],
              value:
                "Durante las últimas cuatro décadas, la serie F de Ford ha sido la camioneta más vendida en todo el país. Al tener su sede en Texas, en Rhythm podemos confirmarlo.",
              nodeType: "text",
            },
          ],
          nodeType: BLOCKS.PARAGRAPH,
        },
        {
          data: {},
          content: [
            {
              data: {},
              marks: [],
              value:
                "\nEs un camión que representa el trabajo duro, el aire libre y el trabajo duro al aire libre. Entonces, cuando Ford presentó el nuevo modelo 100% eléctrico de la reconocida F-150, sabíamos que llamaría la atención y llamaría la atención.",
              nodeType: "text",
            },
          ],
          nodeType: BLOCKS.PARAGRAPH,
        },
        {
          data: {},
          content: [
            {
              data: {},
              marks: [],
              value:
                "\nEs un paso que está en línea con nuestra creencia en Rhythm: que la energía renovable es verdaderamente para todos. No tiene por qué ser una decisión candente y con motivaciones políticas. Puede ser una simple elección de poseer un camión versátil, resistente, clásico y ahora ecológico. e de camiones",
              nodeType: "text",
            },
          ],
          nodeType: BLOCKS.PARAGRAPH,
        },
      ],
      nodeType: BLOCKS.DOCUMENT,
    },
  },
  blogPostExcerpt: {
    en: "Learn more about the all-new Ford F-150 and what we think it means for the energy world. For renewable energy plans in Texas, contact Rhythm today!  ",
    es: "Obtén más información sobre la totalmente nueva Ford F-150 y lo que creemos que significa para el mundo de la energía. ¡Para planes de energía renovable en Texas, comuníquese con Rhythm hoy!",
  },
  otherCategories: [
    {
      id: "5cDtXRTKShY1REGjpgyJFN",
      modified: "2021-02-10T19:09:48.223Z",
      categoryName: {
        en: "Featured",
        es: "Destacadas",
      },
      slug: "featured",
      metadata: null,
    },
  ],
  blogTags: {
    en: [
      "Ford",
      "Ford F-150",
      "Ford F-150 Truck",
      "Ford EV",
      "EV Explained",
      "EV Options",
      "Ford Ev Truck",
    ],
    es: [
      "Ford",
      "Ford F-150",
      "Ford F-150 Truck",
      "Ford EV",
      "EV Explained",
      "EV Options",
      "Ford Ev Truck",
    ],
  },
  blogPostAuthor: {
    authorName: "Rhythm Team",
    authorSlug: "rhythm-team",
    authorBio: null,
    authorLink: null,
    authorHeadshot: null,
    authorPosition: null,
  },
  blogPostMetadata: {
    pageDisplayTitle: {
      en: "The New Ford F-150 Lightning: The Future of Trucks | Rhythm",
      es: "La nueva Ford F-150 Lightning: el futuro de las camionetas | Planes de energía renovable de Rhythm en Texas, ¡póngase en contacto con Rhythm hoy!",
    },
    pageNavigationTitle: {
      en: " The New Ford F-150 Lightning: The Future of Trucks ",
      es: " La nueva Ford F-150 Lightning: el futuro de las camionetas",
    },
    pageDescription: {
      en: "Learn more about the all-new Ford F-150 and what we think it means for the energy world. For renewable energy plans in Texas, contact Rhythm today!  ",
      es: "Obtén más información sobre la totalmente nueva Ford F-150 y lo que creemos que significa para el mundo de la energía. ¡Para planes de energía renovable en Texas, comuníquese con Rhythm hoy!",
    },
    openGraphImage: mediaTypeFactory.build(),
    pageHeadersFontWeight: PageFontWeight.Bold,
    pageRobots: "index, follow",
    pageCanonicalUrlOverride: null,
  },
  sections: [],
  blogPostPublishedDate: "2021-10-26T18:43:07.456Z",
  showLimitedNavigation: false,
  similarPostsTitle: {
    en: "Similar Articles",
    es: "Artículos similares",
  },
});
