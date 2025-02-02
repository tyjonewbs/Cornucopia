"use client";

import { getProducts } from "@/app/actions/products";
import { Status } from "@prisma/client";
import { useRouter } from "next/navigation";
import { InventoryManager } from "@/components/InventoryManager";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState, useEffect } from "react";

// Server response type with string dates
type ProductResponse = {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  inventory: number;
  inventoryUpdatedAt: string | null;
  status: Status;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
  totalReviews: number;
  locationName?: string;
  marketStand?: {
    id: string;
    name: string;
  };
  marketStandId: string;
  averageRating: number | null;
  tags: string[];
};

// Client-side type with Date objects
type Product = Omit<ProductResponse, 'createdAt' | 'updatedAt' | 'inventoryUpdatedAt'> & {
  createdAt: Date;
  updatedAt: Date;
  inventoryUpdatedAt: Date | null;
};

type User = {
  id: string;
  marketStandId: string;
};

interface DashboardProductRowProps {
  product: Product;
}

function DashboardProductRow({ product }: DashboardProductRowProps) {
  const handleInventoryUpdate = async (newInventory: number) => {
    const formData = new FormData();
    formData.append('productId', product.id);
    formData.append('inventory', newInventory.toString());

    const response = await fetch('/api/product/inventory', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to update inventory');
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-md">
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16 rounded-md overflow-hidden bg-muted">
          {product.images[0] && (
            <Image
              src={product.images[0]}
              alt={product.name}
              className="object-cover"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          )}
        </div>
        <div>
          <Link href={`/product/${product.id}`}>
            <h3 className="text-lg font-medium">{product.name}</h3>
          </Link>
          <p className="text-sm text-gray-500">{product.description}</p>
          <p className="mt-1">
            <span className="text-sm font-medium">${(product.price / 100).toFixed(2)}</span>
            {' | '}
            <span className="text-sm text-gray-500">{product.locationName}</span>
          </p>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <InventoryManager
          currentInventory={product.inventory}
          onUpdate={handleInventoryUpdate}
        />
        <Link href={`/product/${product.id}/edit`} className="text-sm font-medium text-primary hover:text-primary-focus">
          Edit <span>&rarr;</span>
        </Link>
      </div>
    </div>
  );
}

export default function SellClient() {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check auth status
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !authUser) {
          router.push('/');
          return;
        }

        // Get user profile
        const res = await fetch("/api/user");
        const userData = await res.json();
  
        if (!res.ok) {
          throw new Error(userData.error || 'Failed to fetch user data');
        }
  
        setUser(userData);
  
        // Fetch products and convert dates
        const productsData = await getProducts(userData.id);
        const productsWithDates = productsData.map(product => ({
          ...product,
          createdAt: new Date(product.createdAt),
          updatedAt: new Date(product.updatedAt),
          inventoryUpdatedAt: product.inventoryUpdatedAt ? new Date(product.inventoryUpdatedAt) : null
        }));
        setProducts(productsWithDates);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('An unexpected error occurred');
        }
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 text-center">
          <p className="text-destructive">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Products</h3>
        <p className="text-sm text-muted-foreground">
          Manage and sell your products.
        </p>
      </div>
      <div className="flex justify-end mb-4">
        <Button asChild>
          <Link href="/sell" className="flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Link>
        </Button>
      </div>
      <div className="grid gap-4">
        {products?.map((product) => (
          <DashboardProductRow key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
