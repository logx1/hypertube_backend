import type { Route } from "./+types/infos";

import styles from "./infos.module.css";
import PrimaryButton from "~/components/Button/PrimaryButton";
import { v4 as uuidv4 } from "uuid";
import { useState } from "react";
import PrimaryInput from "../../components/Input/PrimaryInput";
import { SuccessFeedBack } from "~/components/NotificationBox/NotificationBox";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Components" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

interface ComponentInfos {
  name: string;
  path: string;
  component: any;
  declaration?: string;
  interface?: string;
  interfaceDescription?: Array<{ name: string; description: string }>;
}

const CompDisplayer = ({
  component,
  closeDescription,
}: {
  component: ComponentInfos;
  closeDescription: () => void;
}) => {
  const copyToClipBoard = (e: any) => {
    const txt = e.currentTarget.textContent;
    navigator.clipboard.writeText(txt);
  };

  return (
    <div
      className={styles.infosDisplayer}
      onClick={(e: any) => {
        if (e.target.className === styles.infosDisplayer) closeDescription();
      }}
    >
      <div className={styles.contentDisplayer}>
        <p className={styles.title}>{component.name}</p>
        <div className={styles.contentInfos}>
          <div className={styles.contentHolder}>
            <div className={styles.infosNameContainer}>
              <p>Component Path</p>
            </div>
            <div className={styles.infosNameHolder}>
              <p title="Click to copy" onClick={copyToClipBoard}>
                {component.path}
              </p>
            </div>
          </div>
          <div className={styles.contentHolder}>
            <div className={styles.infosNameContainer}>
              <p>Usage example</p>
            </div>
            <div className={styles.infosNameHolder}>
              <code title="Click to copy" onClick={copyToClipBoard}>
                {component.declaration}
              </code>
            </div>
          </div>
          <div className={styles.contentHolder}>
            <div className={styles.infosNameContainer}>
              <p>Component interface</p>
            </div>
            <div className={styles.infosNameHolder}>
              <code title="Click to copy" onClick={copyToClipBoard}>
                {component.interface}
              </code>
            </div>
          </div>
          <div className={styles.interfaceDescription}>
            <p>Interface description</p>
            {/* <div className={styles.interfaceDescriptionWrapper}> */}
            {component.interfaceDescription?.map((ele) => {
              return (
                <div
                  key={uuidv4()}
                  className={styles.interfaceDescriptionWrapper}
                >
                  <p>{ele.name}</p>
                  <p>{ele.description}</p>
                </div>
              );
            })}
            {/* </div> */}
          </div>
          <div className={styles.previewContainer}>
            <p>Preview</p>
            {component.component}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Infos() {
  const [selectedElement, setSelectedElement] = useState<ComponentInfos | null>(
    null
  );

  const closeElement = () => {
    setSelectedElement(null);
  };

  const comps: Array<ComponentInfos> = [
    {
      name: "Primary Button",
      path: "/app/components/PrimaryButton.tsx",
      component: <PrimaryButton text="Hello world" />,
      declaration: `<PrimaryButton text="Hello world" padding="15px 100px" onClick={()=>{console.log('hi')}} />`,
      interface: `interface PrimaryButtonProps {
            text?: string;
            padding?: string;
            onClick?: any;
            }`,
      interfaceDescription: [
        {
          name: "text",
          description:
            'Used to specify the text of button (not required default value is "Click!")',
        },
        {
          name: "padding",
          description:
            "Used to specify the padding of button (not required default value is 15px 100px)",
        },
        {
          name: "onClick",
          description:
            "Function execute when the button is clicked (not required)",
        },
      ],
    },
    {
      name: "Primary Input",
      path: "/app/components/PrimaryInput.tsx",
      component: (
        <PrimaryInput
          type="password"
          width="100%"
          placeHolder="Search for what you want"
          value=""
          name="fuck"
          onChange={(e) => {}}
          leftIcon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={20}
              height={20}
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M12 17a2 2 0 0 1-2-2c0-1.11.89-2 2-2a2 2 0 0 1 2 2a2 2 0 0 1-2 2m6 3V10H6v10zm0-12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10c0-1.11.89-2 2-2h1V6a5 5 0 0 1 5-5a5 5 0 0 1 5 5v2zm-6-5a3 3 0 0 0-3 3v2h6V6a3 3 0 0 0-3-3"
              ></path>
            </svg>
          }
          rightIcon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={20}
              height={20}
              viewBox="0 0 24 24"
            >
              <g fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path d="M3.275 15.296C2.425 14.192 2 13.639 2 12c0-1.64.425-2.191 1.275-3.296C4.972 6.5 7.818 4 12 4s7.028 2.5 8.725 4.704C21.575 9.81 22 10.361 22 12c0 1.64-.425 2.191-1.275 3.296C19.028 17.5 16.182 20 12 20s-7.028-2.5-8.725-4.704Z"></path>
                <path d="M15 12a3 3 0 1 1-6 0a3 3 0 0 1 6 0Z"></path>
              </g>
            </svg>
          }
        />
      ),
      declaration: `<PrimaryInput
              width="500px"
              placeHolder="Type the name of the video you want"
              type="text"
              leftIcon={
                <svg></svg>
              }
              leftIconClick={() => {
                alert("Left icon clicked");
              }}
              rightIcon={
                <svg></svg>
              }
            />`,
      interface: `interface PrimaryInputProps {
            width: string;
            placeHolder: string;
            type: "text" | "password" | "email";
            leftIcon: any;
            leftIconClick?: null | (() => void);
            rightIcon?: any;
            rightIconCLick?: null | (() => void);
            value: string;
            onChange: (e: any) => void;}`,
      interfaceDescription: [
        {
          name: "width (required)",
          description: "The width of the input element.",
        },
        {
          name: "placeHolder (required)",
          description: "The placeholder of the input",
        },
        {
          name: "leftIcon (required)",
          description:
            "svg tag of the icon you want to put on the left of the input tag",
        },
        {
          name: "leftIconClick (not required)",
          description:
            "The function you want to execute if the user clicked on the left icon",
        },
        {
          name: "rightIcon (not required)",
          description:
            "svg tag of the icon you want to put on the right of the input tag",
        },
        {
          name: "rightIconCLick (not required)",
          description:
            "The function you want to execute if the user clicked on the right icon",
        },
        { name: "value (required)", description: "The value of the input" },
        {
          name: "onChange (required)",
          description:
            "The function you want to execute when user type something",
        },
      ],
    },
    {
      name: "Feedback notification",
      path: "/app/components/NotificationBox/NotificationBox.tsx",
      component: (
        <SuccessFeedBack notificationMsg="hello world" notificationId="1" />
      ),
      declaration: `<SuccessFeedBack notificationMsg="hello world" notificationId="1" />`,
      interface: ``,
      interfaceDescription: [],
    },
  ];

  return (
    <div className={styles.infosContainer}>
      {selectedElement != null && (
        <CompDisplayer
          component={selectedElement}
          closeDescription={closeElement}
        />
      )}
      {comps.map((ele) => {
        return (
          <div
            className={styles.compContainer}
            key={uuidv4()}
            onClick={() => {
              setSelectedElement(ele);
            }}
          >
            <p className={styles.componentName}>{ele.name}</p>

            {ele.component}
          </div>
        );
      })}
    </div>
  );
}
