import { useMutation } from "@tanstack/react-query";
import {
  polishTextService,
  getCompletionService,
  generateOutlineService,
  createCharacterService,
} from '@/lib/services/ai.service';
import type {
  PolishRequest,
  CompletionRequest,
  GenerateOutlineRequest,
  CreateCharacterRequest,
} from '@/lib/services/ai.service';

export const usePolishTextMutation = () => {
  return useMutation({
    mutationFn: (params: PolishRequest) => polishTextService(params),
  });
};

export const useGetCompletionMutation = () => {
  return useMutation({
    mutationFn: (params: CompletionRequest) => getCompletionService(params),
  });
};

export const useGenerateOutlineMutation = () => {
  return useMutation({
    mutationFn: (params: GenerateOutlineRequest) =>
      generateOutlineService(params),
  });
};

export const useCreateCharacterMutation = () => {
  return useMutation({
    mutationFn: (params: CreateCharacterRequest) =>
      createCharacterService(params),
  });
};
