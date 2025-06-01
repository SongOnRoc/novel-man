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
    },
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
  const handleContentInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => handleContentChange(e.target.value);
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

  // 容器基础样式
  const containerStyle = {
    border: "1px solid #ccc",
    borderTop: "none", // 移除顶部边框，避免与标题栏边框重叠
    width: "100%",
    padding: "16px",
    boxSizing: "border-box" as const,
  };

  // 编辑器容器样式
  const editorContainerStyle = {
    ...containerStyle,
  };

  // 集合容器样式
  const collectionContainerStyle = {
    ...containerStyle,
    padding: "8px",
  };

  // 渲染编辑器容器
  if (containerType === CardContainerType.EDITOR) {
    return (
      <div style={editorContainerStyle} ref={containerRef}>
        {isEditingContent ? (
          <textarea
            ref={contentTextareaRef}
            value={card.content || ""}
            onChange={handleContentInputChange}
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              minHeight: "100px",
              outline: "none",
            }}
            placeholder="在此输入内容..."
          />
        ) : (
          <button
            type="button"
            onClick={handleContentEdit}
            style={{
              width: "100%",
              textAlign: "left",
              minHeight: "40px",
              padding: "8px",
              background: "none",
              border: "none",
              cursor: "text",
            }}
          >
            {card.content || "点击添加内容"}
          </button>
        )}
      </div>
    );
  }

  // 渲染集合容器
  if (containerType === CardContainerType.COLLECTION) {
    // 根据布局样式设置容器样式
    let contentLayoutStyle: React.CSSProperties = {
      display: "flex",
      flexDirection: "column",
      gap: "16px",
      overflowY: "auto",
      maxHeight: "500px",
    };

    if (layoutStyle === CollectionLayoutStyle.HORIZONTAL) {
      contentLayoutStyle = {
        display: "flex",
        flexDirection: "row",
        gap: "16px",
        overflowX: "auto",
        maxHeight: "none",
      };
    } else if (layoutStyle === CollectionLayoutStyle.ADAPTIVE) {
      contentLayoutStyle = {
        display: "grid",
        gap: "16px",
        gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
        maxHeight: "none",
      };
    }

    return (
      <div style={collectionContainerStyle}>
        <div style={contentLayoutStyle}>
          {card.childCards && card.childCards.length > 0 ? (
            card.childCards
              .filter((childCard) => childCard.isVisible !== false)
              .map((childCard) => (
                <div key={childCard.id} style={{ width: "100%" }}>
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
            <div style={{ padding: "16px", textAlign: "center", color: "#6b7280" }}>点击"+"按钮添加卡片</div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
