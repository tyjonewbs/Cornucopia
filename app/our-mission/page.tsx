import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Heart, Sprout, Users, DollarSign } from "lucide-react";

export default function OurMissionPage() {
  const missionPoints = [
    {
      icon: <Sprout className="h-8 w-8 text-primary" />,
      title: "Supporting Local Agriculture",
      description: "We believe in strengthening local food systems by connecting farmers and ranchers directly with their communities."
    },
    {
      icon: <DollarSign className="h-8 w-8 text-primary" />,
      title: "Fair Pricing",
      description: "Our platform ensures producers receive fair compensation for their hard work while keeping local food accessible to consumers."
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Building Community",
      description: "We foster connections between producers and consumers, creating a stronger, more resilient local food network."
    },
    {
      icon: <Heart className="h-8 w-8 text-primary" />,
      title: "Fresh & Local",
      description: "We make it easier for community members to access fresh, locally-grown food from producers they know and trust."
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
      {/* Hero Section */}
      <div className="relative h-[400px] rounded-xl overflow-hidden mb-16">
        <Image
          src="/images/how-it-works/seller.jpg"
          alt="Local farmer in their field"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="max-w-3xl text-center px-4">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Our Mission</h1>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed">
              Our mission is to empower small-scale ranchers and farmers to thrive through direct-to-consumer sales. By providing real-time inventory visibility and simplified local food commerce, we help producers capture fair prices for their products while connecting community members to fresh, local food grown by their neighbors.
            </p>
          </div>
        </div>
      </div>

      {/* Mission Points */}
      <div className="grid md:grid-cols-2 gap-8 mb-16">
        {missionPoints.map((point, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 p-2 bg-secondary rounded-lg">
                  {point.icon}
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">{point.title}</h3>
                  <p className="text-muted-foreground">{point.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Values Section */}
      <div>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Our Values</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            These core values guide everything we do in pursuit of our mission.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Transparency</h3>
            <Separator className="bg-primary" />
            <p className="text-muted-foreground">
              We believe in clear, honest communication between producers and consumers, fostering trust and understanding in local food systems.
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Sustainability</h3>
            <Separator className="bg-primary" />
            <p className="text-muted-foreground">
              We support environmentally conscious farming practices and work to reduce the carbon footprint of food distribution.
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Community</h3>
            <Separator className="bg-primary" />
            <p className="text-muted-foreground">
              We prioritize building strong relationships between producers and consumers, creating resilient local food networks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
