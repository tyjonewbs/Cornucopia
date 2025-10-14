import Image from "next/image";

export default function HowItWorks() {
  return (
    <div>
      {/* Process Section */}
      <section className="w-full bg-[#134925] py-16 mb-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-block bg-white rounded-full px-6 py-2 mb-4">
              <span className="text-[#134925] font-medium">How It Works</span>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">The Process We Follow</h2>
            <p className="text-gray-200">Find fresh local products and connect with farmstands in your area</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Connecting dots */}
            <div className="hidden md:block absolute top-1/4 left-0 right-0 h-px bg-gray-400 -z-10" style={{ borderTop: '2px dashed rgba(255,255,255,0.3)' }}></div>

            {/* Step 1 */}
            <div className="relative">
              <div className="w-8 h-8 bg-white rounded-full mx-auto mb-4 flex items-center justify-center">
                <div className="w-3 h-3 bg-[#134925] rounded-full"></div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2 text-center">Explore Farms</h3>
              <p className="text-gray-200 text-center text-sm">
                Discover local farmstands via the map view or list.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="w-8 h-8 bg-white rounded-full mx-auto mb-4 flex items-center justify-center">
                <div className="w-3 h-3 bg-[#134925] rounded-full"></div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2 text-center">Browse Products</h3>
              <p className="text-gray-200 text-center text-sm">
                View farmstand details, including products, photos, and descriptions.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="w-8 h-8 bg-white rounded-full mx-auto mb-4 flex items-center justify-center">
                <div className="w-3 h-3 bg-[#134925] rounded-full"></div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2 text-center">Go to Farmstands</h3>
              <p className="text-gray-200 text-center text-sm">
                Use directions and contact information to visit farmstands.
              </p>
            </div>

            {/* Step 4 */}
            <div className="relative">
              <div className="w-8 h-8 bg-white rounded-full mx-auto mb-4 flex items-center justify-center">
                <div className="w-3 h-3 bg-[#134925] rounded-full"></div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2 text-center">Make a Purchase</h3>
              <p className="text-gray-200 text-center text-sm">
                Use the buy page to purchase products with QR code scanning.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Buyers Section */}
      <section className="w-full bg-white py-16 mb-0">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
                <span className="bg-[#134925] text-white p-2 rounded-full">🛒</span>
                <span className="text-[#134925]">For Buyers</span>
              </h2>
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-700 leading-relaxed mb-6">
                  Discover an incredible variety of local goods right in your neighborhood with Cornucopia. From fresh farm produce to artisanal crafts, homemade goods, and specialty items, our platform shows you what's available near you right now. Each product listing includes a real-time timer showing when it was last updated, helping you gauge availability before you visit.
                </p>
                <p className="text-gray-700 leading-relaxed mb-6">
                  See a product marked as "5 minutes ago"? It's likely still there! Notice "2 days ago"? You might want to check newer listings instead. When you find something you love, our interactive map guides you directly to the market stand.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Many stands offer instant purchasing through their QR code - just scan, pay, and pick up your items. For stands without digital payments, you'll still know exactly what's available and where to find it. It's like having your entire local market community in your pocket, making it easy to support small producers and makers in your area.
                </p>
              </div>
            </div>
            <div className="relative h-[400px] rounded-lg overflow-hidden">
              <Image
                src="https://swhinhgrtcowjmpstozh.supabase.co/storage/v1/object/public/images/pexels-wildlittlethingsphoto-841303.jpg?t=2025-01-21T16%3A44%3A16.245Z"
                alt="Customer browsing local produce"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Sellers Section */}
      <section className="w-full bg-[#F0F0F0] py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="relative h-[400px] rounded-lg overflow-hidden order-2 md:order-1">
              <Image
                src="https://swhinhgrtcowjmpstozh.supabase.co/storage/v1/object/public/images/pexels-pixabay-235725.jpg"
                alt="Local farmer with fresh produce"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
                <span className="bg-[#854D0E] text-white p-2 rounded-full">💼</span>
                <span className="text-[#854D0E]">For Sellers</span>
              </h2>
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-700 leading-relaxed mb-6">
                  List your local goods and reach more customers with Cornucopia's simple digital tools. Whether you're a farmer, artisan, craftsperson, or local producer, get started in minutes by creating your digital market stand. Help customers find you on our interactive map and show them what you have available in real-time.
                </p>
                <p className="text-gray-700 leading-relaxed mb-6">
                  Our platform makes inventory management easy - just update your quantities when they change, and customers will see how fresh and current your listings are. Accept payments your way: integrate our secure QR code system for digital transactions, or stick with traditional payment methods - whatever suits your business.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  The platform is designed to be straightforward and flexible, letting you focus on what matters most: making and selling your products. With Cornucopia, you get modern tools that complement your existing business without complicating it.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
