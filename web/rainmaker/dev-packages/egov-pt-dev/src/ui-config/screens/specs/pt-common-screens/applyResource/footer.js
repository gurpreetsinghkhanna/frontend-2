import {
  getLabel
} from "egov-ui-framework/ui-config/screens/specs/utils";
import { setRoute } from "egov-ui-framework/ui-redux/app/actions";
import get from "lodash/get";
import { getCommonApplyFooter } from "../../utils";
import "./index.css";
import { getQueryArg, validateFields } from "egov-ui-framework/ui-utils/commons";
import { httpRequest } from "../../../../../ui-utils";
import store from "ui-redux/store";
import set from 'lodash/set';
import { toggleSnackbar, handleScreenConfigurationFieldChange as handleField } from 'egov-ui-framework/ui-redux/screen-configuration/actions';

let redirectUrl = getQueryArg(window.location.href, "redirectUrl");

const callBackForApply = async (state, dispatch) => {

  let consumerCode = getQueryArg(window.location.href, "consumerCode");
  let propertyPayload = get(
    state,
    "screenConfiguration.preparedFinalObject.Property"
  );
  let isAssemblyDetailsPropType = validateFields(
    "components.div.children.formwizardFirstStep.children.propertyAssemblyDetails.children.cardContent.children.propertyAssemblyDetailsContainer.children.propertyType",
    state,
    dispatch,
    "register-property"
  );
  let isAssemblyDetailsConstructedArea = validateFields(
    "components.div.children.formwizardFirstStep.children.propertyAssemblyDetails.children.cardContent.children.propertyAssemblyDetailsContainer.children.totalConstructedArea",
    state,
    dispatch,
    "register-property"
  );
  let isAssemblyDetailsusageType = validateFields(
    "components.div.children.formwizardFirstStep.children.propertyAssemblyDetails.children.cardContent.children.propertyAssemblyDetailsContainer.children.usageType",
    state,
    dispatch,
    "register-property"
  );
  let isAssemblyDetailstotalLandArea = validateFields(
    "components.div.children.formwizardFirstStep.children.propertyAssemblyDetails.children.cardContent.children.propertyAssemblyDetailsContainer.children.totalLandArea",
    state,
    dispatch,
    "register-property"
  );

  let isPropertyLocationDetailsValid = validateFields(
    "components.div.children.formwizardFirstStep.children.propertyLocationDetails.children.cardContent.children.propertyLocationDetailsContainer.children",
    state,
    dispatch,
    "register-property"
  );
  // let isPropertyOwnerDetailsValid = validateFields(
  //   "components.div.children.formwizardFirstStep.children.propertyOwnershipDetails.children.cardContent.children.applicantTypeContainer.children",
  //   state,
  //   dispatch,
  //   "register-property"
  // );
  if (
    isAssemblyDetailsPropType &&
    isAssemblyDetailsConstructedArea &&
    isAssemblyDetailstotalLandArea &&
    isAssemblyDetailsusageType &&
    isPropertyLocationDetailsValid
  ) {
    propertyPayload.owners.map(owner => {
      if (!_.isUndefined(owner.status)) {
        owner.status = "INACTIVE"
      }
    })
    if (
      propertyPayload
        .ownershipCategory
        .includes("INDIVIDUAL")
    ) {
      propertyPayload.owners.map(owner => {
        owner.status = "ACTIVE";
      })
      propertyPayload.owners = [...propertyPayload.owners]
    } else if (
      propertyPayload
        .ownershipCategory
        .includes("INSTITUTIONALPRIVATE") ||
      propertyPayload
        .ownershipCategory
        .includes("INSTITUTIONALGOVERNMENT")
    ) {
      propertyPayload.owners.map(owner => {
        owner.status = "ACTIVE";
        owner.ownerType = 'NONE';
        owner.altContactNumber = propertyPayload.institution.landlineNumber;
      })
      propertyPayload.owners = [
        ...propertyPayload.owners
      ]
    }
    set(propertyPayload, "channel", "SYSTEM");
    set(propertyPayload, "source", "MUNICIPAL_RECORDS");
    set(propertyPayload, "noOfFloors", 1);
    propertyPayload.landArea = parseInt(propertyPayload.landArea);
    propertyPayload.tenantId = propertyPayload.address.city;
    propertyPayload.address.city = propertyPayload.address.city.split(".")[1];
    try {
      propertyPayload.creationReason = 'CREATE';
      let payload = null;
      payload = await httpRequest(
        "post",
        "/property-services/property/_create",
        "_update",
        [],
        { Property: propertyPayload }

      );
      if (payload) {
        store.dispatch(handleField("register-property", "components.adhocDialog", "props.open", true));
        setTimeout(() => {
          store.dispatch(
            setRoute(
              `${redirectUrl}?propertyId=${payload.Properties[0].propertyId}&tenantId=${propertyPayload.tenantId}`
            )
          );
        }, 3000);
      }
      else {
        store.dispatch(
          setRoute(
            `acknowledgement?purpose=apply&status=failure&applicationNumber=${consumerCode}&tenantId=${propertyPayload.tenantId}`
          )
        );
      }
    } catch (e) {
      console.log(e);
      store.dispatch(
        setRoute(
          `acknowledgement?purpose=apply&status=failure&applicationNumber=${consumerCode}&tenantId=${propertyPayload.tenantId}
        `
        )
      );
    }
  } else {
    dispatch(
      toggleSnackbar(
        true, {
        labelKey: "PT_COMMON_REQUIRED_FIELDS",
        labelName: "Please fill Required details"
      },
        "warning"
      )
    )
  }
}

export const footer = getCommonApplyFooter({
  payButton: {
    componentPath: "Button",
    props: {
      variant: "contained",
      color: "primary",
      style: {
        minWidth: "200px",
        height: "48px",
        marginRight: "45px"
      }
    },
    children: {
      submitButtonLabel: getLabel({
        labelName: "Submit",
        labelKey: "PT_COMMON_BUTTON_SUBMIT"
      }),
    },
    onClickDefination: {
      action: "condition",
      callBack: callBackForApply
    },
    visible: true
  }
});
