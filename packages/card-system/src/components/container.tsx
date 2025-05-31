import { useEffect, useRef, useState } from "react";
import { CardComponent } from "../card-component";
import type { BaseCardProps, CardButtonsConfig, CardProperty } from "../types";
import { CardContainerType, CollectionLayoutStyle } from "../types";

interface ContainerProps {
  card: BaseCardProps;
  containerType: CardContainerType;
  layoutStyle?: CollectionLayoutStyle;
  onUpdateCard: (id: string, updates: Partial<BaseCardProps>) => void;
  onDeleteCard?: (id: string) => void;
  onAddChildCard?: <T extends number | CardProperty[] = CardProperty[]>(
    parentId: string,
    containerType: CardContainerType,
    options?: {
      title?: string;
      hideTitle?: boolean;
      props?: T extends CardProperty[] ? T : never;
      parentCardCount?: T extends number ? T : never;
    }
  ) => void;
  onRelateCard?: (id: string) => void;
  onUnrelateCard?: (id: string) => void;
  onChangeLayoutStyle?: (id: string, style: CollectionLayoutStyle) => void;
  buttonsConfig?: CardButtonsConfig;
  attributeOptions?: Array<{ value: string; label: string }>;
  availableRelateItems?: Array<{ id: string; title: string; type: string }>;
}

export function Container({
  card,
  containerType,
  layoutStyle = CollectionLayoutStyle.VERTICAL,
  onUpdateCard,
  onDeleteCard,
  onAddChildCard,
  onRelateCard,
  onUnrelateCard,
  onChangeLayoutStyle,
  buttonsConfig = {
    showEditButton: true,
    showAddButton: true,
    showDeleteButton: true,
    showRelateButton: false,
    showLayoutStyleButton: false,
  },
  attributeOptions = [],
  availableRelateItems = [],
}: ContainerProps) {
  const [isEditingContent, setIsEditingContent] = useState(false);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 编辑器获取焦点
  useEffect(() => {
    if (isEditingContent && contentTextareaRef.current) {
      contentTextareaRef.current.focus();
    }
  }, [isEditingContent]);

  // 处理内容编辑
  const handleContentEdit = () => setIsEditingContent(true);
  const handleContentChange = (value: string) => onUpdateCard(card.id, { content: value });
  const handleContentInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => 
    handleContentChange(e.target.value);
  const handleContentSave = () => setIsEditingContent(false);

  // 处理点击外部关闭编辑器
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isEditingContent && containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsEditingContent(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isEditingContent]);

  // 渲染编辑器容器
  if (containerType === CardContainerType.EDITOR) {
    return (
      <div className="p-4" ref={containerRef}>
        {isEditingContent ? (
          <textarea
            ref={contentTextareaRef}
            value={card.content || ""}
            onChange={handleContentInputChange}
            className="w-full p-2 border rounded min-h-[100px] focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="在此输入内容..."
          />
        ) : (
          <button
            type="button"
            onClick={handleContentEdit}
            className="w-full text-left min-h-[40px] p-2 hover:bg-gray-50 rounded"
          >
            {card.content || "点击添加内容"}
          </button>
        )}
      </div>
    );
  }

  // 渲染集合容器
  if (containerType === CardContainerType.COLLECTION) {
    // 根据布局样式设置容器类名
    let layoutClassName = "flex flex-col gap-4 p-2 overflow-y-auto max-h-[500px]";
    if (layoutStyle === CollectionLayoutStyle.HORIZONTAL) {
      layoutClassName = "flex overflow-x-auto gap-4 py-2";
    } else if (layoutStyle === CollectionLayoutStyle.ADAPTIVE) {
      layoutClassName = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-2";
    }

    return (
      <div className={`bg-white ${layoutClassName}`}>
        {card.childCards && card.childCards.length > 0 ? (
          card.childCards
            .filter((childCard) => childCard.isVisible !== false)
            .map((childCard) => (
              <div key={childCard.id} className="min-w-[250px]">
                <CardComponent
                  card={childCard}
                  onUpdateCard={onUpdateCard}
                  onDeleteCard={onDeleteCard}
                  onAddChildCard={onAddChildCard}
                  onRelateCard={onRelateCard}
                  onUnrelateCard={onUnrelateCard}
                  onChangeLayoutStyle={onChangeLayoutStyle}
                  buttonsConfig={buttonsConfig}
                  attributeOptions={attributeOptions}
                  availableRelateItems={availableRelateItems}
                  layoutStyle={layoutStyle}
                />
              </div>
            ))
        ) : (
          <div className="p-4 text-center text-gray-500">点击"+"按钮添加卡片</div>
        )}
      </div>
    );
  }

  return null;
}