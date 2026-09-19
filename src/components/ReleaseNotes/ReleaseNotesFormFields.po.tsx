import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, type UseFormReturn, useForm } from "react-hook-form";
import type { ReleaseNotesTextFieldSaveStatus } from "src/components/ReleaseNotes/ReleaseNotesFormFields.component";
import { ReleaseNotesFormFields } from "src/components/ReleaseNotes/ReleaseNotesFormFields.component";
import {
  buildReleaseNotesFormSchema,
  type ReleaseNotesFormValues,
} from "src/lib/validation/releaseNotes.schemas";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import type { DiscogsCollectionField } from "src/types";
import { definedProps } from "src/utils/definedProps";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";

export type ReleaseNotesFormFieldsRenderProps = {
  textFields: DiscogsCollectionField[];
  conditionFields?: DiscogsCollectionField[];
  defaultValues?: ReleaseNotesFormValues;
  disabled?: boolean;
  layout?: "default" | "modal";
  textFieldSaveStatus?: Record<string, ReleaseNotesTextFieldSaveStatus>;
  onTextFieldChange?: (
    fieldId: number,
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => void;
  onTextFieldFocus?: (fieldId: number) => void;
  onTextFieldBlur?: (fieldId: number) => void;
  onConditionFieldChange?: (fieldId: number, value: string) => void;
};

type ReleaseNotesFormFieldsHarnessProps = ReleaseNotesFormFieldsRenderProps & {
  formMethodsRef: { current: UseFormReturn<ReleaseNotesFormValues> | null };
};

const ReleaseNotesFormFieldsHarness = ({
  formMethodsRef,
  textFields,
  conditionFields = [],
  defaultValues = {},
  disabled,
  layout,
  textFieldSaveStatus,
  onTextFieldChange,
  onTextFieldFocus,
  onTextFieldBlur,
  onConditionFieldChange,
}: ReleaseNotesFormFieldsHarnessProps) => {
  const textFieldIds = textFields.map((field) => field.id);
  const methods = useForm<ReleaseNotesFormValues>({
    resolver: zodResolver(buildReleaseNotesFormSchema(textFieldIds)),
    defaultValues,
    mode: "onChange",
  });

  formMethodsRef.current = methods;

  return (
    <FormProvider {...methods}>
      <ReleaseNotesFormFields
        textFields={textFields}
        conditionFields={conditionFields}
        {...definedProps({
          disabled,
          layout,
          textFieldSaveStatus,
          onTextFieldChange,
          onTextFieldFocus,
          onTextFieldBlur,
          onConditionFieldChange,
        })}
      />
    </FormProvider>
  );
};

export class ReleaseNotesFormFieldsPageObject extends BasePageObject {
  private formMethodsRef: {
    current: UseFormReturn<ReleaseNotesFormValues> | null;
  } = { current: null };

  constructor(props: BasePageObjectProps = {}) {
    super(props);
  }

  renderReleaseNotesFormFields(
    props: ReleaseNotesFormFieldsRenderProps,
  ): RenderResult {
    return render(
      <ReleaseNotesFormFieldsHarness
        formMethodsRef={this.formMethodsRef}
        {...props}
      />,
    );
  }

  getFormMethods(): UseFormReturn<ReleaseNotesFormValues> {
    if (!this.formMethodsRef.current) {
      throw new Error("ReleaseNotesFormFields was not rendered");
    }

    return this.formMethodsRef.current;
  }
}
