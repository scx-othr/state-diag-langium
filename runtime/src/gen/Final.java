public class Final extends State {

    public Final(GumballMachine context) {
        super(context);
    }

    @Override
    public void onEntry() {
        System.out.println("System is shutting down ....");
         context.setState(null);
    }

}
