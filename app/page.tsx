import { ProductRow } from "../components/ProductRow";

export default async function Home() {
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 mb-24">
      <div className="max-w-3xl mx-auto text-2xl sm:text-5xl lg:text-6xl font-semibold text-center">
        <h1>Discover Fresh Local</h1>
        <h1 className="text-primary">Farm Products</h1>
        <p className="lg:text-lg text-muted-foreground mx-auto mt-5 w-[90%] font-normal text-base">
          Find the freshest products from local farmstands near you. Support your local
          farmers and enjoy farm-fresh goods delivered directly to you.
        </p>
      </div>
      <ProductRow title="Recently Added" link="/local-spots" />
    </section>
  );
}
