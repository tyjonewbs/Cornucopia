"use client";

import Image from "next/image";
import Link from "next/link";
import { Plus, Pencil, Store, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  isOnline: boolean;
  marketStands: Array<{
    id: string;
    name: string;
  }>;
  updatedAt: Date;
}

interface ProductCatalogListProps {
  products: Product[];
}

export function ProductCatalogList({ products }: ProductCatalogListProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Product Catalog</h1>
        <Link href="/product/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Product</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Listed At</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="flex items-center space-x-4">
                    <div className="relative w-12 h-12 rounded-md overflow-hidden">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span className="font-medium">{product.name}</span>
                  </div>
                </TableCell>
                <TableCell>{formatPrice(product.price / 100)}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    {product.isOnline && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        Online
                      </Badge>
                    )}
                    {product.marketStands.map((stand) => (
                      <Badge key={stand.id} variant="outline" className="flex items-center gap-1">
                        <Store className="h-3 w-3" />
                        {stand.name}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Link href={`/product/${product.id}/edit`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit product</span>
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
