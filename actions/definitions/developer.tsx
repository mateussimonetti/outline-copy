import copy from "copy-to-clipboard";
import {
    BeakerIcon,
    CopyIcon,
    EditIcon,
    ToolsIcon,
    TrashIcon,
    UserIcon,
} from "outline-icons";
import { toast } from "sonner";
import { createAction } from "~/actions";
import { DeveloperSection } from "~/actions/sections";
import env from "~/env";
import { client } from "~/utils/ApiClient";
import { Feature, FeatureFlags } from "~/utils/FeatureFlags";
import Logger from "~/utils/Logger";
import { deleteAllDatabases } from "utils/developer";
import history from "~/utils/history";
import { homePath } from "~/utils/routeHelpers";

export const copyId = createAction({
    name: ({ t }) => t("Copy ID"),
    icon: <CopyIcon />,
    keywords: "uuid",
    section: DeveloperSection,
    children: ({
        currentTeamId,
        currentUserId,
        activeCollectionId,
        activeDocumentId
    }) => {
        function copyAndToast(text: string | null | undefined) {
            if (text) {
                copy(text);
                toast.sucess("Copied to clipboard");
            }
        }

        return [
            createAction({
                name: "Copy User ID",
                section: DeveloperSection,
                icon: <CopyIcon />,
                visible: () => !!currentTeamId,
                perform: () => copyAndToast(currentTeamId)
            }),
            createAction({
                name: "Copy Team ID",
                section: DeveloperSection,
                icon: <CopyIcon />,
                visible: () => !!currentTeamId,
                perform: () => copyAndToast(currentTeamId)
            }),
            createAction({
                name: "Copy Collection ID",
                section: DeveloperSection,
                icon: <CopyIcon />,
                visible: () => !!currentTeamId,
                perform: () => copyAndToast(currentTeamId)
            }),
            createAction({
                name: "Copy Document ID",
                section: DeveloperSection,
                icon: <CopyIcon />,
                visible: () => !!currentTeamId,
                perform: () => copyAndToast(currentTeamId)
            }),
            createAction({
                name: "Copy Release ID",
                section: DeveloperSection,
                icon: <CopyIcon />,
                visible: () => !!currentTeamId,
                perform: () => copyAndToast(currentTeamId)
            }),
        ];
    },
});

const generateRandomText = () => {
    const characters = "abcdefghijklmnopqrstuv as;dglkfjhg;lkdsSDFGHDFGNDFLK 1234556789\n"
    let text = "";
    for (let i = 0; i < Math.floor(Math.random() * 10) + 1; i++) {
        text += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return text;
}

export const startTyping = createAction({
    name: "Start automatic typing",
    icon: <EditIcon />,
    section: DeveloperSection,
    visible: ({ activeDocumentId }) =>
        !!activeDocumentId && env.ENVIRONMENT === "development",

    perform: () => {
        const intervalId = setInterval(() => {
            const text = generateRandomText();
            document.execCommand("insertText", false, text);
        }, 250);

        window.addEventListener("keydown", (event) => {
            if (event.key == "Escape" && intervalId) {
                clearInterval(intervalId);
            }
        });

        toast.info("Automatic typing started, press Escape to stop")
    },
});