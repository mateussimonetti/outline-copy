import copy from "copy-to-clipboard";
import invariant from "invariant";
import uniqBy from "lodash/uniqBy";
import {
    DownloadIcon,
    DuplicateIcon,
    StarredIcon,
    PrintIcon,
    UnstarredIcon,
    DocumentIcon,
    NewDocumentIcon,
    ShapesIcon,
    ImportIcon,
    PinIcon,
    SearchIcon,
    UnsubscribeIcon,
    SubscribeIcon,
    MoveIcon,
    TrashIcon,
    CrossIcon,
    ArchiveIcon,
    ShuffleIcon,
    HistoryIcon,
    GraphIcon,
    UnpublishIcon,
    PublishIcon,
    CommentIcon,
    CopyIcon,
    EyeIcon,
    PadlockIcon,
    GlobeIcon,
    LogoutIcon,
    CaseSensitiveIcon,
} from "outline-icons";
import { toast } from "sonner";
import Icon from "@shared/components/Icon";
import {
    ExportContentType,
    TeamPreference,
    NavigationNode,
} from "@shared/types";
import { getEventFiles } from "@shared/utils/files";
import UserMembership from "~/models/UserMembership";
import DocumentDelete from "~/scenes/DocumentDelete";
import DocumentMove from "~/scenes/DocumentMove";
import DocumentPermanentDelete from "~/scenes/DocumentPermanentDelete";
import DocumentPublish from "~/scenes/DocumentPublish";
import DeleteDocumentsInTrash from "~/scenes/Trash/components/DeleteDocumentsInTrash";
import ConfirmationDialog from "~/components/ConfirmationDialog";
import DocumentCopy from "~/components/DocumentCopy";
import MarkdownIcon from "~/components/Icons/MarkdownIcon";
import SharePopover from "~/components/Sharing/Document";
import { getHeaderExpandedKey } from "~/components/Sidebar/components/Header";
import DocumentTemplatizeDialog from "~/components/TemplatizeDialog";
import { createAction } from "~/actions";
import {
    ActiveDocumentSection,
    DocumentSection,
    TrashSection,
} from "~/actions/sections";
import env from "~/env";
import { setPersistedState } from "~/hooks/usePersistedState";
import history from "~/utils/history";
import {
    documentInsightsPath,
    documentHistoryPath,
    homePath,
    newDocumentPath,
    newNestedDocumentPath,
    searchPath,
    documentPath,
    urlify,
    trashPath,
} from "~/utils/routeHelpers";

export const openDocument = createAction({
    name: ({ t }) => t("Open document"),
    analyticsName: "Open document",
    section: DocumentSection,
    shortcut: ["o", "d"],
    keywords: "go to",
    icon: <DocumentIcon />,
    children: ({ stores }) => {
        const nodes = stores.collections.navigationNodes.reduce(
            (acc, node) => [...acc, ...node.children],
            [] as NavigationNode[]
        );
        const documents = stores.documents.orderedData;

        return uniqBy([...documents, ...nodes], "id").map((item) => ({
            id: item.url,
            name: item.title,
            icon: item.icon ? (<Icon value={item.icon} color={item.color ?? undefined} />
            ) : (
                <DocumentIcon />
            ),
            section: DocumentSection,
            to: item.url
        }));
    },
});

export const createDocument = createAction({
    name: ({ t }) => t("New document"),
    analyticsName: "New document",
    section: DocumentSection,
    icon: <NewDocumentIcon />,
    keywords: "create",
    visible: ({ currentTeamId, activeCollectionId, stores }) => {
        if (
            activeCollectionId &&
            !stores.policies.abilities(activeCollectionId).createDocument
        ) {
            return false;
        }

        return (
            !!currentTeamId && stores.policies.abilities(currentTeamId).createDocument
        );
    },
    perform: ({ activeCollectionId, sidebarContext }) =>
        history.push(newDocumentPath(activeCollectionId), { sidebarContext }),
});

export const createDraftDocument = createAction({
    name: ({ t }) => t("New draft"),
    analyticsName: "New draft",
    section: DocumentSection,
    icon: <NewDocumentIcon />,
    keywords: "create document",
    visible: ({ currentTeamId, stores }) =>
        !!currentTeamId && stores.policies.abilities(currentTeamId).createDocument,
    perform: ({ sidebarContext }) =>
        history.push(newDocumentPath(), { sidebarContext }),
});

export const createDocumentFromTemplate = createAction({
    name: ({ t }) => t("New from template"),
    analyticsName: "New from template",
    section: DocumentSection,
    icon: <NewDocumentIcon />,
    keywords: "create",
    visible: ({
        currentTeamId,
        activeCollectionId,
        activeDocumentId,
        stores
    }) => {
        const document = activeDocumentId
            ? stores.documents.get(activeDocumentId)
            : undefined;

        if (
            !currentTeamId ||
            !document?.isTemplate ||
            !!document?.isDraft ||
            !!document?.isDeleted
        ) {
            return false;
        }

        if (activeCollectionId) {
            return stores.policies.abilities(activeCollectionId).createDocument;
        }
        return stores.policies.abilities(currentTeamId).createDocument;
    },
    perform: ({ activeCollectionId, activeDocumentId, sidebarContext }) =>
        history.push(newDocumentPath(activeCollectionId, { templateId: activeDocumentId }), { sidebarContext }),
});


