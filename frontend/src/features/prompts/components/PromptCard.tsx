import type { PromptForClient } from "@/lib/services/prompt.service";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Flame, Book, Feather } from "lucide-react";

function PromptCard({ prompt }: { prompt: PromptForClient }) {
  const summary = prompt.summary || [];
  const footerTags = prompt.footerTags || [];

  const iconMap: { [key: string]: React.ElementType } = {
    Book,
    Feather,
  };

  return (
    <Card className="flex flex-col h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 bg-white rounded-2xl overflow-hidden border-gray-200/80">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-4">
          <CardTitle className="text-base font-semibold leading-tight line-clamp-2">{prompt.title}</CardTitle>
          <Button variant="ghost" className="bg-pink-100 text-pink-600 hover:bg-pink-200 hover:text-pink-700 rounded-full px-4 py-1 h-auto text-xs shrink-0">
            移除
          </Button>
        </div>
        <div className="mt-2">
            <Badge className="bg-orange-100 text-orange-600 border-none rounded-md text-xs font-normal px-2 py-0.5">{prompt.primaryTag}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow pt-0 pb-3">
        <div className="flex items-center text-xs text-muted-foreground mb-3">
          <Avatar className="h-6 w-6 mr-2">
            <AvatarImage src={prompt.authorAvatar} alt={prompt.author} />
            <AvatarFallback>{prompt.author?.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="font-medium text-gray-700 flex items-center">
            {prompt.author}
            <Star className="w-3.5 h-3.5 ml-1 text-yellow-500 fill-current" />
          </span>
          <span className="text-gray-500 ml-1">{prompt.authorSpecialty}</span>
        </div>
        <div className="flex items-center text-xs text-muted-foreground mb-4">
            <Flame className="w-4 h-4 mr-1 text-red-500" />
            <span className="text-red-500 font-semibold">{Intl.NumberFormat().format(prompt.usageCount || 0)}</span>
            <span className="mx-2">·</span>
            <span>{prompt.updatedAt}</span>
        </div>
        <p className="text-sm text-gray-600 line-clamp-3 mb-3">
          {prompt.description}
        </p>
        <div className="space-y-1.5 text-sm">
            {Array.isArray(summary) && summary.map((item: { icon?: string; text?: string }, index) => {
                if (!item.icon) return null;
                const IconComponent = iconMap[item.icon];
                if (!IconComponent) return null;
                return (
                    <div key={index} className="flex items-center text-gray-500">
                        <IconComponent className="w-4 h-4 mr-2 shrink-0" />
                        <span className="flex-1 text-xs">{item.text}</span>
                    </div>
                );
            })}
        </div>
      </CardContent>
      <CardFooter className="pt-2 pb-3 px-4">
        <div className="flex items-center gap-2 flex-wrap">
            {Array.isArray(footerTags) && footerTags.map((tag: string) => (
                <Badge key={tag} variant="outline" className="bg-gray-100 border-gray-200 text-gray-600 text-xs font-normal rounded-sm">
                    {tag}
                </Badge>
            ))}
        </div>
      </CardFooter>
    </Card>
  );
}

export default PromptCard;
