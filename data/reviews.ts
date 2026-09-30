/**
 * Customer reviews, as received by email from Ventra Sciences customers
 * (Revised Research is Ventra, rebranded). Text is verbatim. No star ratings:
 * none were given, so none are shown.
 *
 * Left out on purpose: reviews that claim the compounds "work" or give
 * "results" (research-use-only framing). Never add invented or edited quotes.
 */
export type Review = { name: string; quote: string };

export const REVIEWS_SOURCE = "Reviews from Ventra Sciences customers, before our rebrand to Revised Research. Published as received.";

export const REVIEWS: Review[] = [
  { name: "David Martinez", quote: "Third order this month. Their peptides are consistently pure and the prices keep me coming back. Shipping to my lab takes 2-3 days max." },
  { name: "Prof. Jennifer L.", quote: "Switched from a major supplier and saved thousands last year. Quality never dipped. The speed of delivery is honestly better than what I was getting before." },
  { name: "Alex Thompson", quote: "Tried 4 different brands before landing here. The compound purity is noticeably better and costs less. Best decision for our research facility." },
  { name: "Dr. William Chen", quote: "Been in this field 15 years. These are the best peptides I've worked with at this price point. Their consistency is unmatched." },
  { name: "Katie Rodriguez", quote: "Fast shipping and affordable pricing is hard to find together. Got my order in 3 days and the quality exceeded expectations." },
  { name: "Institute for Molecular Research", quote: "Our purchasing director compared 8 suppliers. We chose these guys based on price and purity data. Haven't regretted it once." },
  { name: "Tom Berkley", quote: "Used to order from overseas sources that took forever. This domestic supplier ships in 2 days and the quality is superior." },
  { name: "Dr. Priya Patel", quote: "The compounds are legitimately the best I've tested. I've recommended them to 5 other labs already." },
  { name: "Research Analytics LLC", quote: "Great pricing structure and their bulk discounts are actually competitive. Shipping is reliable and consistent." },
  { name: "Marcus Johnson", quote: "Been a customer for 18 months. Their pricing has stayed stable while quality remains excellent. That's rare in this market." },
  { name: "Lab Supplies Co.", quote: "Fastest turnaround we've experienced. Order placed Friday, received Monday. Compounds are exactly what we need." },
  { name: "Dr. Rachel Foster", quote: "Consistent quality across all my orders. The affordability lets us run more experiments. Shipping speed keeps our timeline on track." },
  { name: "Biotech Startup", quote: "When we were bootstrapping, their pricing made it possible to run proper research. Quality never suffered for the low cost." },
  { name: "James Mitchell", quote: "Tested their compounds against a premium competitor's. Same purity, way better price. Made the switch permanently." },
  { name: "Dr. Howard Klein", quote: "15 years in research and these are some of the most reliable peptides I've ordered. Fast delivery too." },
  { name: "Analytics Research Group", quote: "We do bulk orders and their pricing structure is the best in the industry. Delivery is consistently fast." },
  { name: "Nina Flores", quote: "Second order and already impressed. The compound purity is exactly as advertised and shipping was incredibly fast." },
  { name: "Dr. Geoffrey Smith", quote: "Compared their COA data to other suppliers. The consistency and purity metrics are superior, and it costs less. No brainer." },
  { name: "Marcus T.", quote: "Been ordering research compounds for 3 years and tried at least 5 other suppliers. These guys have the cleanest products and their pricing is actually unbeatable. Free shipping on orders over $150 is a huge plus." },
  { name: "Dr. Sarah K.", quote: "Ordered Monday morning, arrived Wednesday. That's the kind of turnaround time you need when running time-sensitive experiments. Quality is consistent too." },
  { name: "James R.", quote: "Compared their prices to other suppliers and they're significantly cheaper without sacrificing quality. My lab has switched completely." },
  { name: "Lisa Chen", quote: "Been ordering for 2 years now. Their compounds are reliable, shipping is fast, and they haven't raised prices. That loyalty discount adds up." },
  { name: "Dr. Michael P.", quote: "Used to buy from a competitor but switched after one order here. The purity and consistency are noticeably better. Worth every penny." },
  { name: "Academic Lab", quote: "Had a tight deadline for our research. They shipped same-day and we got it in 2 days. Other suppliers took a week. Lifesaver." },
  { name: "Robert G.", quote: "I was skeptical about the lower pricing at first but their quality matches suppliers charging 30% more. Switching my whole operation over." },
  { name: "Dr. Elena V.", quote: "Ordered 6 times now. Every batch is exactly what it says it is. Their tech support actually knows what they're talking about too." },
  { name: "Nathan S.", quote: "Tested samples from 3 companies. These guys have the best compounds for the money. Fast shipping is the cherry on top." },
  { name: "Research Institute", quote: "After dealing with inconsistent quality elsewhere, we're happy to have found a reliable partner. Pricing is competitive and delivery is reliable." },
];
