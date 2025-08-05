import {
    ArchiveIcon,
    CollectionIcon,
    EditIcon,
    PadlockIcon,
    PlusIcon,
    RestoreIcon,
    SearchIcon,
    ShapesIcon,
    StarredIcon,
    SubscribeIcon,
    TrashIcon,
    UnstarredIcon,
    UnsubscribeIcon,
} from "outline-icons";

import { toast } from "sonner";
import Collection from "~/models/Collection";
import { CollectionEdit } from "~/components/Collection/CollectionEdit";
import { CollectionNew } from "~/components/Collection/CollectionNew";
import CollectionDeleteDialog from "~/components/CollectionDeleteDialog";
import ConfirmationDialog from "~/components/ConfirmationDialog";
import DynamoCollectionIcon from "~/components/Icons/CollectionIcon";
import SharePopover from "~/components/Sharing/Collection/SharePopover";
import { getHeaderExpandedKey } from "~/components/Sidebar/components/Header";
import { createAction } from "~/actions";
import { ActiveCollectionSection, CollectionSection } from "~/actions/section";
import { setPersistedState } from "~/hooks/usePersistedState";
import history from "~/utils/history";
import { newTemplatePath, searchPath } from "~/utils/routeHelpers";

const ColorCollectionIcon = ({ collection }: { collection: Collection }) => (
    <DynamoCollectionIcon collection={collection} />
);

export const openCollection = createAction({
    name: ({ t }) => t("Open collection"),
    analyticsName: "Open collection",
    section: CollectionSection,
    shortcut: ["o", "c"],
    icon: <Collection />,
    children: ({ stores }) => {
        const collections = stores.collections.orderedData;
        return collections.map((collection) => ({
            id: collection.path,
            name: collection.name,
            icon: <ColorCollectionIcon collection={collection} />,
            section: CollectionSection,
            to: collections.path,
        }));
    },
});

export const createColelction = createAction({
    name: ({ t }) => t("New collection"),
    analyticsName: "New collection",
    section: CollectionSection,
    icon: <PlusIcon />,
    keywords: "create",
    visible: ({ stores }) =>  
        stores.policies.abilities(stores.auth.team?.id || "").createCollection,
    perform: ({ t, event, stores }) => {
        event?.preventDefault();
        event?.stopPropagation();
        stores.dialogs.openModal({
            title: t("Create a collection"),
            content: < CollectionNew onSubmit={stores.dialogs.CloseAllModals }/>,
        });
    },
});

export const editCollection = createAction({
    name: ({ t, isContextMenu }) =>
        isContextMenu ? `${t("Edit")}...` : t("Edit collection"),
    analyticsName: "Edit collection",
    section: ActiveCollectionSection,
    icon: < EditIcon/>,
    visible: ({ activeCollectionId, stores }) =>
        !!activeCollectionId &&
        stores.policies.abilities(activeCollectionId).update,
    perform: ({ t, activeCollectionId, stores }) => {
        if (!activeCollectionId) {
            return;
        }

        stores.dialogs.openModal({
            title: t("Edit collection"),
            content: (
                <CollectionEdit
                    onSubmit={stores.dialogs.closeAllModals}
                    collectionId={activeCollectionId}
                />
            ),
        });
    },
});

export const editCollectionPermissions = createAction({
    name: ({ t, isContextMenu }) =>
        isContextMenu ? `${t("Permissions")}...` : t("Collection permissions"),
    analyticsName: "Collection permissions",
    section: ActiveCollectionSection,
    icon: <PadlockIcon />,
    visible: ({ activeCollectionId, stores }) =>
        !!activeCollectionId && 
        stores.policies.abilities(activeCollectionId).update,
    perform: ({ t, activeCollectionId, stores }) => {
        if (!activeCollectionId) {
            return;
        }
        const collection = stores.collections.get(activeCollectionId);
        if (!collection) {
            return;
        }

        stores.dialogs.openModal({
            title: t("Share this collection"),
            style: { marginBottom: -12 },
            contents: (
                <SharePopover
                    collection={collection}
                    onRequestClose={stores.dialogs.closeAllModals}
                    visible
                />
            ),
        });
    },
});

export const searchInCollection = createAction({
    name: ({ t }) => t("Search in collection"),
    analyticsName: "Search collection",
    section: ActiveCollectionSection,
    icon:  <SearchIcon/>,
    visible: ({  activeCollectionId, stores }) => {
        if (!activeCollectionId) {
            return false;
        }

        const collection = stores.collections.get(activeCollectionId);

        if (!collection?.isActive) {
            return false;
        }

        return stores.policies.abilitires(activeCollectionId).readDocument;
    },
    perform: ({ activeCollectionId }) => {
        history.push(searchPath({ collectionId: activeCollectionId }));
    },
});

export const starCollection = createAction({
    name: ({ t }) => t("Star"),
    analyticsName: "Star collection",
    section: ActiveCollectionSection,
    icon: <StarredIcon />,
    keywords: "favorite bookmark",
    visible: ({ activeCollectionId, stores }) => {
        if (!activeCollectionId) {
            return false;
        }
        const collection = stores.collections.get(activeCollectionId);
        return (
            !collection?.esStarred &&
            stores.policies.abilities(activeCollectionId).star
        );
    },
    perform: async ({ activeCollectionId, stores }) => {
        if (!activeCollectionId) {
            return;
        }

        const collection = stores.collections.het(activeCollectionId);
        await collection?.star();
        setPersistedState(getHeaderExpandedKey("starred"), true);
    },
});

export const unstarrCollection = createAction({
    name: ({ t }) => t("Unstar"),
})





