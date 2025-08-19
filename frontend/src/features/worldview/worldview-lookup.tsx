import { useQuery } from "@tanstack/react-query";
import { Globe } from "lucide-react";
import React from "react";

import { LookupSource } from "@/components/common/SettingsLookup";
import { getItemsService } from "@/lib/services/worldview.service";
import { WorldviewItem } from "@/lib/services/worldview.service";

import { WorldviewItemCard } from "./components/WorldviewItemCard";


const useWorldviewData = ({
  workId,
  searchTerm,
}: {
  workId: string;
  searchTerm: string;
}) => {
  // TODO: Replace with a proper API endpoint that accepts workId
  const { data, isLoading } = useQuery({
    queryKey: ["worldviewItems"],
    queryFn: () => getItemsService({ category_id: 1 }), // Dummy category_id
  });

  const items = data?.data;
  const filteredData = (Array.isArray(items) ? items : []).filter(
    (item: WorldviewItem) =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return { data: filteredData, isLoading };
};

export const worldviewLookupSource: LookupSource<WorldviewItem> = {
  name: "世界观",
  icon: <Globe className="h-4 w-4" />,
  useData: useWorldviewData,
  renderItem: ({ item, onSelect }) => (
    <WorldviewItemCard worldItem={item} onSelect={onSelect} />
  ),
};