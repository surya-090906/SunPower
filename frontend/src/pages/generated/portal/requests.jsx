// Native React page. Data contract: portal/requests.
import { Fragment, cssStyle, text } from "@ui/runtime";
export default function Page({ data, state }) {
  return (
    <>
      {"\n"}
      <div className={"spread mb"}>
        <div>
          <h1>{"Service requests"}</h1>
          <p className={"muted"} style={cssStyle("margin:0")}>
            {"Report a fault and follow the repair."}
          </p>
        </div>
        <a className={"btn btn-primary"} href={"/portal/requests/new/"}>
          {"Report a problem"}
        </a>
      </div>
      {"\n"}
      <div className={"stack"}>
        {"\n"}
        {data.rows1?.length ? (
          data.rows1.map((row1, index) => (
            <Fragment key={index}>
              {"\n  "}
              <a
                className={"pcard"}
                href={"/portal/requests/" + text(row1.v2) + "/"}
              >
                {"\n    "}
                <div className={"spread"}>
                  <b>
                    {row1.v3}
                    {row1.choice4 === 0 ? (
                      <>
                        {" · "}
                        {row1.v5}
                      </>
                    ) : null}
                  </b>
                  <span className={"badge " + text(row1.v6)}>{row1.v7}</span>
                </div>
                {"\n    "}
                <div className={"small muted"}>
                  {row1.v8}
                  {row1.choice9 === 0 ? (
                    <>
                      {" · fault "}
                      {row1.v10}
                    </>
                  ) : null}
                  {" · "}
                  {row1.v11}
                </div>
                {"\n    "}
                {row1.choice12 === 0 ? (
                  <>
                    <div className={"mt-s"}>
                      <span className={"btn btn-primary btn-sm"}>
                        {"Confirm it works"}
                      </span>
                    </div>
                  </>
                ) : null}
                {"\n  "}
              </a>
              {"\n"}
            </Fragment>
          ))
        ) : (
          <>
            <div className={"pcard center"}>
              <p className={"muted"}>
                {
                  "No service requests. If something stops working, tell us here."
                }
              </p>
            </div>
          </>
        )}
        {"\n"}
      </div>
      {"\n"}
    </>
  );
}
