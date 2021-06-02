import Postmen, {Role} from "./src/Postmen";

let postmaster = new Postmen({
    authKey: '5997231',
    role: Role.Parent
});

let son = document.getElementById('son') as HTMLIFrameElement;
postmaster.startConnect(son)


