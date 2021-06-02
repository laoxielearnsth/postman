import Postmen, {Role} from "./src/Postmen";

let postmaster = new Postmen({
    authKey: '5997231',
    role: Role.Son
});


postmaster.addEventListener('thing1', function () {
    console.log('do thing 1')
});

postmaster.addEventListener('thing2', function () {
    console.log('do thing 2')
    return 'thing2'
});

postmaster.addEventListener('thing3', function () {});
postmaster.addEventListener('thing4', function () {});


