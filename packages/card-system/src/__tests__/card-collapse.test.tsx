import { fireEvent, render, screen } from "@testing-library/react";
import { CardComponent } from "../card-component";
import type { BaseCardProps } from "../types";
import { CardContainerType } from "../types";

describe("CardComponent - Collapse Functionality", () => {
  const mockUpdateCard = jest.fn();

  const renderCard = (isCollapsed = false) => {
    const card: BaseCardProps = {
      id: "1",
      title: "Test Card",
      containerType: CardContainerType.EDITOR,
      content: "Test content",
      isCollapsed,
    };

    return render(<CardComponent card={card} onUpdateCard={mockUpdateCard} onDeleteCard={jest.fn()} />);
  };

  beforeEach(() => {
    mockUpdateCard.mockClear();
  });

  test("collapses card when collapse button is clicked", () => {
    renderCard(false);

    fireEvent.click(screen.getByLabelText("折叠卡片"));
    expect(mockUpdateCard).toHaveBeenCalledWith("1", { isCollapsed: true });
  });

  test("expands card when expand button is clicked", () => {
    renderCard(true);

    fireEvent.click(screen.getByLabelText("展开卡片"));
    expect(mockUpdateCard).toHaveBeenCalledWith("1", { isCollapsed: false });
  });

  test("hides content when card is collapsed", () => {
    renderCard(true);
    expect(screen.queryByText("Test content")).not.toBeInTheDocument();
  });

  test("shows content when card is expanded", () => {
    renderCard(false);
    expect(screen.getByText("Test content")).toBeInTheDocument();
  });
});
