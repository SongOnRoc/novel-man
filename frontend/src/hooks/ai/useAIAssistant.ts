import { useMutation } from "@tanstack/react-query";
import {
  polishText,
  getCompletion,
  generateOutline,
  createCharacter,
} from "@/lib/api/ai";
import {
  PolishTextRequest,
  GetCompletionRequest,
  GenerateOutlineRequest,
  CreateCharacterRequest,
} from "@/types/ai";

export const usePolishTextMutation = () => {
  return useMutation({
    mutationFn: (params: PolishTextRequest) => polishText(params),
  });
};

export const useGetCompletionMutation = () => {
  return useMutation({
    mutationFn: (params: GetCompletionRequest) => getCompletion(params),
  });
};

export const useGenerateOutlineMutation = () => {
  return useMutation({
    mutationFn: (params: GenerateOutlineRequest) => generateOutline(params),
  });
};

export const useCreateCharacterMutation = () => {
  return useMutation({
    mutationFn: (params: CreateCharacterRequest) => createCharacter(params),
  });
};
