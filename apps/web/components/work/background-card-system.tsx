"use client";

import { useState, useCallback } from "react";
import { CardSystem, CardContainerType } from "./base-card-system";
import type { BaseCardProps } from "./base-card-system";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/tailwind/ui/dialog";
import { Button } from "@/components/tailwind/ui/button";
import { Label } from "@/components/tailwind/ui/label";
import { Input } from "@/components/tailwind/ui/input";
import { Textarea } from "@/components/tailwind/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/tailwind/ui/select";

// 背景类型
const BACKGROUND_TYPES = [
  { value: "world", label: "世界观" },
  { value: "power", label: "力量体系" },
  { value: "history", label: "历史背景" },
  { value: "custom", label: "自定义背景" }
];

// 背景设定对话框属性
interface BackgroundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: { title: string; type: string; content: string }) => void;
  defaultValues?: { title: string; type: string; content: string };
}

// 背景设定对话框
function BackgroundDialog({ open, onOpenChange, onConfirm, defaultValues }: BackgroundDialogProps) {
  const [title, setTitle] = useState(defaultValues?.title || "");
  const [type, setType] = useState(defaultValues?.type || "world");
  const [content, setContent] = useState(defaultValues?.content || "");

  const handleSubmit = () => {
    if (!title.trim()) return;
    onConfirm({ title, type, content });
    onOpenChange(false);
  };

  // 重置表单
  const resetForm = () => {
    setTitle(defaultValues?.title || "");
    setType(defaultValues?.type || "world");
    setContent(defaultValues?.content || "");
  };

  // 当对话框打开时重置表单
  const handleOpenChange = (open: boolean) => {
    if (open) {
      resetForm();
    }
    onOpenChange(open);
  };

  const getTypeLabel = (value: string) => {
    return BACKGROUND_TYPES.find(t => t.value === value)?.label || value;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>背景设定</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">设定标题</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入设定标题"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="type">背景类型</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="type">
                <SelectValue placeholder="选择背景类型" />
              </SelectTrigger>
              <SelectContent>
                {BACKGROUND_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="content">背景内容</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="详细描述该背景设定..."
              rows={6}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit}>确认</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 子内容对话框属性
interface ContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (content: string) => void;
  defaultContent?: string;
}

// 子内容对话框
function ContentDialog({ open, onOpenChange, onConfirm, defaultContent = "" }: ContentDialogProps) {
  const [content, setContent] = useState(defaultContent);

  const handleSubmit = () => {
    onConfirm(content);
    onOpenChange(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setContent(defaultContent);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>编辑内容</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="详细内容..."
            rows={10}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit}>确认</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 背景设定卡片系统属性
interface BackgroundCardSystemProps {
  isMobile?: boolean;
}

export function BackgroundCardSystem({ isMobile = false }: BackgroundCardSystemProps) {
  // 对话框状态
  const [backgroundDialogOpen, setBackgroundDialogOpen] = useState(false);
  const [contentDialogOpen, setContentDialogOpen] = useState(false);
  const [currentCardId, setCurrentCardId] = useState<string | null>(null);
  const [currentParentId, setCurrentParentId] = useState<string | null>(null);
  
  // 卡片数据状态
  const [cards, setCards] = useState<BaseCardProps[]>([]);

  // 添加背景设定卡片（页面级添加按钮）
  const handleAddCard = useCallback((containerType: CardContainerType, title?: string) => {
    // 打开背景设定创建对话框
    setBackgroundDialogOpen(true);
  }, []);

  // 确认添加背景设定
  const handleAddBackground = useCallback((data: { title: string; type: string; content: string }) => {
    const typeLabel = BACKGROUND_TYPES.find(t => t.value === data.type)?.label || data.type;
    
    const newCard: BaseCardProps = {
      id: `background-${Date.now()}`,
      title: data.title,
      content: data.content,
      type: typeLabel,
      tag: `background-${data.type}`, // 标签为background-xxx
      isCollapsed: false,
      containerType: CardContainerType.COLLECTION, // 背景设定卡片是集合类卡片
      childCards: [], // 子卡片初始为空
      showEditButton: true,
      showAddButton: true,
      showDeleteButton: true,
      showRelateButton: false,
    };
    setCards(prev => [...prev, newCard]);
  }, []);

  // 更新卡片
  const handleUpdateCard = useCallback((id: string, updates: Partial<BaseCardProps>) => {
    setCards(prev => prev.map(card => {
      // 更新主卡片
      if (card.id === id) {
        return { ...card, ...updates };
      }
      
      // 如果是集合类卡片，检查其子卡片
      if (card.containerType === CardContainerType.COLLECTION && card.childCards) {
        const updatedChildCards = card.childCards.map(childCard => {
          if (childCard.id === id) {
            return { ...childCard, ...updates };
          }
          
          // 检查三级卡片（子卡片的子卡片）
          if (childCard.containerType === CardContainerType.COLLECTION && childCard.childCards) {
            const updatedGrandChildCards = childCard.childCards.map(grandChildCard => 
              grandChildCard.id === id ? { ...grandChildCard, ...updates } : grandChildCard
            );
            return { ...childCard, childCards: updatedGrandChildCards };
          }
          
          return childCard;
        });
        return { ...card, childCards: updatedChildCards };
      }
      
      return card;
    }));
  }, []);

  // 删除卡片
  const handleDeleteCard = useCallback((id: string) => {
    setCards(prev => {
      // 递归函数，用于删除任何层级的卡片
      const removeCardById = (cards: BaseCardProps[]): BaseCardProps[] => {
        // 过滤掉要删除的卡片
        const filtered = cards.filter(card => card.id !== id);
        
        // 处理子卡片
        return filtered.map(card => {
          if (card.containerType === CardContainerType.COLLECTION && card.childCards) {
            return {
              ...card,
              childCards: removeCardById(card.childCards)
            };
          }
          return card;
        });
      };
      
      return removeCardById(prev);
    });
  }, []);

  // 添加子卡片到父卡片的辅助函数
  const addChildCardToParent = useCallback((parentId: string, childCard: BaseCardProps) => {
    setCards(prev => {
      const updateCardWithChild = (cards: BaseCardProps[]): BaseCardProps[] => {
        return cards.map(card => {
          if (card.id === parentId) {
            return {
              ...card,
              childCards: [...(card.childCards || []), childCard]
            };
          }
          
          if (card.containerType === CardContainerType.COLLECTION && card.childCards) {
            return {
              ...card,
              childCards: updateCardWithChild(card.childCards)
            };
          }
          
          return card;
        });
      };
      
      return updateCardWithChild(prev);
    });
  }, []);

  // 添加子卡片
  const handleAddChildCard = useCallback((parentId: string, containerType: CardContainerType, title?: string, hideTitle = false) => {
    console.log("BACKGROUND handleAddChildCard called:", { parentId, containerType, title, hideTitle });
    
    // 首先获取父卡片，以确定其标签
    const findParentCard = (cards: BaseCardProps[]): BaseCardProps | null => {
      for (const card of cards) {
        if (card.id === parentId) return card;
        
        if (card.containerType === CardContainerType.COLLECTION && card.childCards) {
          const found = findParentCard(card.childCards);
          if (found) return found;
        }
      }
      return null;
    };
    
    const parentCard = findParentCard(cards);
    if (!parentCard) {
      console.error("Parent card not found:", parentId);
      return;
    }
    
    console.log("Parent card found:", parentCard);
    setCurrentParentId(parentId);
    
    if (containerType === CardContainerType.EDITOR) {
      // 如果是编辑器类卡片
      // 创建一个临时ID
      const tempId = `${parentCard.tag}-detail-${Date.now()}`;
      setCurrentCardId(tempId);
      
      // 创建编辑器卡片
      const newCard: BaseCardProps = {
        id: tempId,
        title: title || "详细内容",
        content: "",
        type: "detail",
        tag: `${parentCard.tag}-detail`,
        isCollapsed: false,
        containerType: CardContainerType.EDITOR,
        hideTitle: hideTitle, // 根据参数决定是否隐藏标题
        showEditButton: !hideTitle, // 如果显示标题则显示编辑按钮
        showAddButton: false,
        showDeleteButton: true,
        showRelateButton: false,
      };
      
      console.log("Creating background editor card:", { hideTitle, newCard });
      
      // 添加编辑器卡片
      addChildCardToParent(parentId, newCard);
      
      // 打开内容对话框
      setContentDialogOpen(true);
    } else if (containerType === CardContainerType.COLLECTION) {
      // 如果是集合类卡片
      const newCard: BaseCardProps = {
        id: `${parentCard.tag}-collection-${Date.now()}`,
        title: title || "集合卡片",
        content: "",
        type: "collection",
        tag: `${parentCard.tag}-collection`,
        isCollapsed: false,
        containerType: CardContainerType.COLLECTION,
        childCards: [],
        showEditButton: true,
        showAddButton: true,
        showDeleteButton: true,
        showRelateButton: false
      };
      
      // 添加集合卡片
      addChildCardToParent(parentId, newCard);
    }
  }, [cards, setCurrentParentId, setContentDialogOpen, addChildCardToParent]);

  // 确认添加子内容
  const handleAddContent = useCallback((content: string) => {
    if (!currentParentId && !currentCardId) return;
    
    // 如果是已存在的卡片，直接更新内容
    if (currentCardId) {
      handleUpdateCard(currentCardId, { content });
      return;
    }
    
    // 查找父卡片以获取其标签
    const findParentCard = (cards: BaseCardProps[]): BaseCardProps | null => {
      for (const card of cards) {
        if (card.id === currentParentId) return card;
        
        if (card.containerType === CardContainerType.COLLECTION && card.childCards) {
          const found = findParentCard(card.childCards);
          if (found) return found;
        }
      }
      return null;
    };
    
    const parentCard = findParentCard(cards);
    if (!parentCard) return;
    
    // 创建内容卡片，标签基于父卡片标签
    const newContentCard: BaseCardProps = {
      id: `${parentCard.tag}-detail-${Date.now()}`,
      title: "详细内容",
      content: content,
      type: "detail",
      tag: `${parentCard.tag}-detail`, // 标签为父标签-detail
      isCollapsed: false,
      containerType: CardContainerType.EDITOR, // 内容卡片是编辑器类卡片
      hideTitle: true, // 默认隐藏标题
      showEditButton: false,
      showAddButton: false,
      showDeleteButton: true,
      showRelateButton: false,
    };
    
    // 添加内容卡片
    addChildCardToParent(currentParentId, newContentCard);
  }, [currentParentId, currentCardId, cards, handleUpdateCard]);

  // 编辑卡片内容
  const handleEditCard = useCallback((id: string) => {
    setCurrentCardId(id);
    
    // 查找卡片以获取其内容
    const findCard = (cards: BaseCardProps[]): BaseCardProps | null => {
      for (const card of cards) {
        if (card.id === id) return card;
        
        if (card.containerType === CardContainerType.COLLECTION && card.childCards) {
          const found = findCard(card.childCards);
          if (found) return found;
        }
      }
      return null;
    };
    
    const card = findCard(cards);
    if (!card) return;
    
    if (card.tag?.startsWith('background-')) {
      // 如果是顶级背景卡片，打开背景设定对话框
      setBackgroundDialogOpen(true);
    } else {
      // 如果是内容卡片，打开内容对话框
      setContentDialogOpen(true);
    }
  }, [cards]);

  // 更新卡片内容
  const handleUpdateContent = useCallback((content: string) => {
    if (!currentCardId) return;
    handleUpdateCard(currentCardId, { content });
  }, [currentCardId, handleUpdateCard]);

  // 更新背景设定
  const handleUpdateBackground = useCallback((data: { title: string; type: string; content: string }) => {
    if (!currentCardId) return;
    
    const typeLabel = BACKGROUND_TYPES.find(t => t.value === data.type)?.label || data.type;
    
    handleUpdateCard(currentCardId, { 
      title: data.title,
      content: data.content,
      type: typeLabel,
      tag: `background-${data.type}`
    });
  }, [currentCardId, handleUpdateCard]);

  // 移动卡片
  const handleMoveCard = useCallback((dragIndex: number, hoverIndex: number) => {
    setCards(prev => {
      const newCards = [...prev];
      const [removed] = newCards.splice(dragIndex, 1);
      newCards.splice(hoverIndex, 0, removed);
      return newCards;
    });
  }, []);

  // 获取当前选中卡片的默认值（用于对话框初始值）
  const getSelectedCardDefaultValues = useCallback(() => {
    if (!currentCardId) return { title: "", type: "world", content: "" };
    
    const findCard = (cards: BaseCardProps[]): BaseCardProps | null => {
      for (const card of cards) {
        if (card.id === currentCardId) return card;
        
        if (card.containerType === CardContainerType.COLLECTION && card.childCards) {
          const found = findCard(card.childCards);
          if (found) return found;
        }
      }
      return null;
    };
    
    const card = findCard(cards);
    if (!card) return { title: "", type: "world", content: "" };
    
    // 从tag中提取类型
    const typeMatch = card.tag?.match(/background-(.+)/);
    const type = typeMatch ? typeMatch[1] : "world";
    
    return {
      title: card.title,
      type,
      content: card.content || ""
    };
  }, [currentCardId, cards]);

  // 对话框关闭时清除当前状态
  const handleDialogClose = useCallback((setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter(false);
    setCurrentCardId(null);
    setCurrentParentId(null);
  }, []);

  return (
    <>
      <CardSystem
        cards={cards}
        title="背景设定"
        onAddCard={handleAddCard}
        onUpdateCard={handleUpdateCard}
        onDeleteCard={handleDeleteCard}
        onAddChildCard={handleAddChildCard}
        moveCard={handleMoveCard}
        isMobile={isMobile}
        addButtonText="添加背景设定"
        buttonsConfig={{
          showEditButton: true,
          showAddButton: true,
          showDeleteButton: true,
          showRelateButton: false
        }}
      />

      <BackgroundDialog 
        open={backgroundDialogOpen} 
        onOpenChange={(open) => !open && handleDialogClose(setBackgroundDialogOpen)}
        onConfirm={currentCardId ? handleUpdateBackground : handleAddBackground}
        defaultValues={currentCardId ? getSelectedCardDefaultValues() : undefined}
      />
      
      <ContentDialog 
        open={contentDialogOpen}
        onOpenChange={(open) => !open && handleDialogClose(setContentDialogOpen)}
        onConfirm={currentCardId ? handleUpdateContent : handleAddContent}
        defaultContent={currentCardId ? getSelectedCardDefaultValues().content : ""}
      />
    </>
  );
} 